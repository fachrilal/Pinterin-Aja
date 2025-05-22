import { useEffect, useState } from 'react';
import StatCard from '../components/StatCard';
import ActivityTable from '../components/ActivityTable';
import axios from 'axios';
import { Bar } from 'react-chartjs-2';
import { Chart, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js';

Chart.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

export default function Dashboard() {
  const [stats, setStats] = useState({ buku: 0, anggota: 0, peminjaman: 0 });
  const [nama, setNama] = useState("");

  useEffect(() => {
    const storedEmail = localStorage.getItem("email");
    if (storedEmail) {
      const username = storedEmail.split("@")[0];
      setNama(username.charAt(0).toUpperCase() + username.slice(1));
    }

    const token = localStorage.getItem('token');
    const headers = {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    };

    const bukuReq = axios.get('http://45.64.100.26:88/perpus-api/public/api/buku', { headers });
    const memberReq = axios.get('http://45.64.100.26:88/perpus-api/public/api/member', { headers });
    const pinjamReq = axios.get('http://45.64.100.26:88/perpus-api/public/api/peminjaman', { headers });

    Promise.all([bukuReq, memberReq, pinjamReq])
      .then(([bukuRes, memberRes, pinjamRes]) => {
        setStats({
          buku: Array.isArray(bukuRes.data) ? bukuRes.data.length : (bukuRes.data?.data?.length || 0),
          anggota: Array.isArray(memberRes.data) ? memberRes.data.length : (memberRes.data?.data?.length || 0),
          peminjaman: Array.isArray(pinjamRes.data) ? pinjamRes.data.length : (pinjamRes.data?.data?.length || 0),
        });
      })
      .catch(() => setStats({ buku: 0, anggota: 0, peminjaman: 0 }));
  }, []);

  const chartData = {
    labels: ['Buku', 'Anggota', 'Peminjaman'],
    datasets: [
      {
        label: 'Statistik Perpustakaan',
        data: [stats.buku, stats.anggota, stats.peminjaman],
        backgroundColor: [
          'rgba(16, 185, 129, 0.7)',   // green-500
          'rgba(251, 191, 36, 0.7)',   // yellow-400
          'rgba(71, 85, 105, 0.7)',    // slate-700
        ],
        borderRadius: 8,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
      tooltip: { enabled: true },
    },
    scales: {
      y: { beginAtZero: true, ticks: { stepSize: 1 } },
    },
  };

  return (
    <div className="pt-24 pb-12 px-4 sm:px-8 md:px-16 bg-gray-50 min-h-screen text-gray-800 w-full box-border">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 text-gray-800">
            Selamat datang{nama ? `, ${nama}` : ""} 👋
          </h1>
          <p className="text-gray-600 text-base">
            Dashboard perpustakaan digital. Pantau statistik buku, anggota, dan aktivitas peminjaman di sini.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <StatCard title="Total Buku" value={stats.buku} />
          <StatCard title="Anggota" value={stats.anggota} />
          <StatCard title="Peminjaman Hari Ini" value={stats.peminjaman} />
        </div>

        {/* Penjelasan dan Foto Perpustakaan */}
        <div className="flex flex-col md:flex-row items-center gap-10 mb-12">
          <div className="flex-1">
            <h2 className="text-2xl md:text-3xl font-extrabold mb-3 tracking-tight">
              Tentang Perpustakaan Kami
            </h2>
            <p className="text-gray-700 text-base md:text-lg mb-5 leading-relaxed">
              Perpustakaan digital kami menyediakan ribuan koleksi buku dari berbagai kategori untuk mendukung kebutuhan belajar dan literasi masyarakat.
              Dengan sistem digital, pencarian dan peminjaman buku menjadi lebih mudah, cepat, dan efisien.<br />
              Bergabunglah bersama kami untuk memperluas wawasan dan pengetahuan Anda!
            </p>
            <ul className="list-disc pl-6 text-gray-600 text-sm md:text-base space-y-1">
              <li>
                <span className="font-semibold">Koleksi buku lengkap</span> dan selalu diperbarui
              </li>
              <li>
                <span className="font-semibold">Peminjaman & pengembalian</span> mudah secara online
              </li>
              <li>
                <span className="font-semibold">Komunitas pembaca</span> aktif dan ramah
              </li>
            </ul>
          </div>
          <div className="flex-1 flex gap-4">
            <img
              src="https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=400&q=80"
              alt="Library interior"
              className="rounded-xl shadow-lg w-1/2 object-cover h-44 border-4 border-gray-100"
            />
            <img
              src="https://images.unsplash.com/photo-1503676382389-4809596d5290?auto=format&fit=crop&w=400&q=80"
              alt="Bookshelf in library"
              className="rounded-xl shadow-lg w-1/2 object-cover h-44 border-4 border-gray-100"
            />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-8 mb-12 max-w-3xl mx-auto">
          <h2 className="text-lg font-semibold mb-4 text-gray-800">Statistik Visual</h2>
          <Bar data={chartData} options={chartOptions} height={120} />
        </div>
      </div>
    </div>
  );
}
