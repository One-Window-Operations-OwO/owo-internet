export async function register() {
    if (process.env.NEXT_RUNTIME === 'nodejs') {
        try {
            console.log('Instrumentation: Checking database...');

            const { createDatabaseIfNotExists } = await import("@/lib/db");
            const { createUserTable } = await import("@/lib/db/users");
            createDatabaseIfNotExists();
            createUserTable();

            console.log('Instrumentation: Database initialized successfully');
        } catch (error) {
            console.error('Instrumentation: Database initialization failed:', error);
        }
    }
}
