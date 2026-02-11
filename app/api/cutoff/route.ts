import { NextResponse } from 'next/server';
import { insertCutoffData, getCutoffDataByUser, insertCutoffHistoryLog } from '@/lib/db/cutoff';
import { checkExistingResiNumbers } from '@/lib/db/cutoff';

export async function POST(request: Request) {
    try {
        const { userIds, token } = await request.json();
        if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
            return NextResponse.json({ error: 'userIds array is required' }, { status: 400 });
        }
        if (!token) {
            return NextResponse.json({ error: 'token is required' }, { status: 400 });
        }
        const response = await fetch(process.env.SKYLINK_URL + '/api/v1/shipments?status=PENDING_VERIFICATION&limit=100000&offset=0', {
            headers: {
                'accept': '*/*',
                'accept-language': 'en-US,en;q=0.9,id-ID;q=0.8,id;q=0.7',
                'authorization': `Bearer ${token}`,
                'cache-control': 'no-cache',
                'cookie': `auth_token=${token}`,
                'pragma': 'no-cache',
                'priority': 'u=1, i',
                'sec-ch-ua': '"Google Chrome";v="143", "Chromium";v="143", "Not A(Brand";v="24"',
                'sec-ch-ua-arch': '""',
                'sec-ch-ua-bitness': '"64"',
                'sec-ch-ua-full-version': '"143.0.7499.169"',
                'sec-ch-ua-full-version-list': '"Google Chrome";v="143.0.7499.169", "Chromium";v="143.0.7499.169", "Not A(Brand";v="24.0.0.0"',
                'sec-ch-ua-mobile': '?1',
                'sec-ch-ua-model': '"Nexus 5"',
                'sec-ch-ua-platform': '"Android"',
                'sec-ch-ua-platform-version': '"6.0"',
                'sec-fetch-dest': 'empty',
                'sec-fetch-mode': 'cors',
                'sec-fetch-site': 'same-origin',
                'user-agent': 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Mobile Safari/537.36'
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch shipments: ${response.statusText}`);
        }

        const responseData = await response.json();
        const allShipments = responseData.data;

        if (!allShipments || !Array.isArray(allShipments) || allShipments.length === 0) {
            return NextResponse.json({ message: 'No data found from source', count: 0 });
        }
        const resiNumbersToCheck = allShipments.map((item: any) => item.resi_number);
        const existingResiList = await checkExistingResiNumbers(resiNumbersToCheck);
        const newShipments = allShipments.filter((item: any) => !existingResiList.includes(item.resi_number));
        if (newShipments.length === 0) {
            return NextResponse.json({
                success: true,
                message: 'No new data to import. All items already exist in database.',
                count: 0
            });
        }

        const totalItems = newShipments.length;
        const totalUsers = userIds.length;

        const baseCount = Math.floor(totalItems / totalUsers);
        const remainder = totalItems % totalUsers;

        const dataToInsert = [];
        let currentIndex = 0;

        for (let i = 0; i < totalUsers; i++) {

            const countForThisUser = i === 0 ? baseCount + remainder : baseCount;
            const userId = userIds[i];

            for (let j = 0; j < countForThisUser; j++) {
                if (currentIndex >= totalItems) break;

                const item = newShipments[currentIndex];

                dataToInsert.push([
                    item.id,
                    item.school_name,
                    item.school_id,
                    item.resi_number,
                    item.starlink_id,
                    new Date(item.received_date),
                    userId
                ]);

                currentIndex++;
            }
        }

        if (dataToInsert.length > 0) {
            await insertCutoffData(dataToInsert);
        }

        // Log history
        await insertCutoffHistoryLog({
            total_new_items: totalItems,
            users_count: totalUsers,
            base_per_user: baseCount,
            remainder: remainder,
            skipped_count: allShipments.length - newShipments.length,
            details: {
                userIds,
                distribution_logic: "sequential"
            }
        });

        return NextResponse.json({
            success: true,
            message: `Processed ${dataToInsert.length} new items (Skipped ${allShipments.length - newShipments.length} duplicates).`,
            distribution: {
                totalNewItems: totalItems,
                users: totalUsers,
                basePerUser: baseCount,
                remainder,
                skipped: allShipments.length - newShipments.length
            }
        });

    } catch (error: any) {
        console.error('Error processing cutoff:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('user_id');
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '10');
        const offset = (page - 1) * limit;

        if (!userId) {
            return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
        }

        const { data, total } = await getCutoffDataByUser(userId, limit, offset);

        return NextResponse.json({
            data,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error: any) {
        console.error('Error fetching cutoff data:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
