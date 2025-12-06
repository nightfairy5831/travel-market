import Link from 'next/link';

export default function AdminPage() {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link href="/admin/companions" className="block p-6 border rounded-lg hover:shadow-lg">
          <h2 className="text-xl font-semibold mb-2">Companions</h2>
          <p className="text-gray-600">Approve, reject, suspend companions</p>
        </Link>
        <Link href="/admin/bookings" className="block p-6 border rounded-lg hover:shadow-lg">
          <h2 className="text-xl font-semibold mb-2">Bookings</h2>
          <p className="text-gray-600">View, cancel, refund bookings</p>
        </Link>
      </div>
    </div>
  );
}