export async function register() {
    if (process.env.NEXT_RUNTIME === 'nodejs') {
        try {
            console.log('Instrumentation: Checking database...');

            const { createDatabaseIfNotExists } = await import("@/lib/db");
            const { createUserTable, seedUsers } = await import("@/lib/db/users");
            const { createSubClusterTable } = await import("@/lib/db/clusters");
            const { createCutoffTable } = await import("@/lib/db/cutoff");
            const { createLogsTable } = await import("@/lib/db/logs");
            const { createCutoffHistoryLogTable } = await import("@/lib/db/cutoff");

            await createDatabaseIfNotExists();
            await createUserTable();
            await seedUsers();
            await createSubClusterTable();
            await createCutoffTable();
            await createCutoffHistoryLogTable();
            await createLogsTable();

            console.log('Instrumentation: Database initialized successfully');
        } catch (error) {
            console.error('Instrumentation: Database initialization failed:', error);
        }
    }
}
