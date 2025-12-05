export default function DashboardHeader({ profile }) {
  return (
    <div className="text-center mb-8">
      <h1 className="text-4xl font-bold text-gray-800 mb-2">Dashboard</h1>
      <p className="text-gray-600">
        Welcome back, {profile.full_name || profile.email}
      </p>
    </div>
  );
}