export default function StatCard({ title, value }) {
    return (
      <div className="bg-white rounded-xl shadow p-4">
        <p className="text-sm text-gray-500">{title}</p>
        <p className="text-xl font-bold">{value}</p>
      </div>
    )
  }
  