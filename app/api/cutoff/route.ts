import { NextResponse } from 'next/server';
import { insertCutoffData } from '@/lib/db/cutoff';

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
        const shipments = responseData.data;

        if (!shipments || !Array.isArray(shipments) || shipments.length === 0) {
             return NextResponse.json({ message: 'No data found from source', count: 0 });
        }

        const totalItems = shipments.length;
        const totalUsers = userIds.length;
        
        const baseCount = Math.floor(totalItems / totalUsers);
        const remainder = totalItems % totalUsers;

        const dataToInsert = [];
        let currentIndex = 0;

        for (let i = 0; i < totalUsers; i++) {
            // First user gets baseCount + remainder, others get baseCount
            const countForThisUser = i === 0 ? baseCount + remainder : baseCount;
            const userId = userIds[i];

            for (let j = 0; j < countForThisUser; j++) {
                if (currentIndex >= totalItems) break;
                const item = shipments[currentIndex];
                
                // Map item to table columns
                // school_name, npsn, resi_number, bapp_number, starlink_id, received_date, user_id
                // Note: Ensure received_date is formatted correctly if needed. 
                // Creating a new Date(item.received_date) usually works with updates to mysql2/dates.
                
                dataToInsert.push([
                    item.school_name,
                    item.school_id, // maps to npsn
                    item.resi_number,
                    item.bapp_number,
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

        return NextResponse.json({ 
            success: true, 
            message: `Processed ${dataToInsert.length} items.`,
            distribution: {
                totalItems,
                users: totalUsers,
                basePerUser: baseCount,
                remainder,
                firstUserGot: baseCount + remainder
            }
        });

    } catch (error: any) {
        console.error('Error processing cutoff:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
