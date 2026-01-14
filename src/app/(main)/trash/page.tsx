export default function TrashPage() {
  return (
    <div className="h-full bg-base-100 rounded-box p-6">
      <h1 className="text-2xl font-bold mb-4">Trash</h1>
      <p className="text-base-content/70">Deleted files will be kept for 30 days before being permanently removed.</p>
      
      <div className="flex flex-col items-center justify-center h-64 text-base-content/50">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
        <p>Trash is empty</p>
      </div>
    </div>
  );
}
