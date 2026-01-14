export default function RecentPage() {
    return (
        <div className="h-full bg-base-100 rounded-box p-6">
            <h1 className="text-2xl font-bold mb-4">Recent</h1>
            <p className="text-base-content/70">Your recently accessed files will appear here.</p>

            <div className="flex flex-col items-center justify-center h-64 text-base-content/50">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p>No recent activity</p>
            </div>
        </div>
    );
}
