export default function OwoPage() {
    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold tracking-tight text-neutral-900">Workspace</h2>
                <p className="mt-1 text-sm text-neutral-500">Area kerja utama untuk pemrosesan data.</p>
            </div>

            <div className="border-l-4 border-blue-500 bg-blue-50 p-4 rounded-r-lg">
                <div className="flex">
                    <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <div className="ml-3">
                        <p className="text-sm text-blue-700">
                            Workspace OwO aktif.
                        </p>
                    </div>
                </div>
            </div>

            <div className="rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm h-96 flex items-center justify-center">
                <p className="text-neutral-400">Komponen workspace akan dimuat di sini.</p>
            </div>
        </div>
    );
}
