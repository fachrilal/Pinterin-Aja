import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import { API_URL } from '../../constan';

export default function MemberHistory() {
  const [history, setHistory] = useState([]);
  const [fines, setFines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [member, setMember] = useState(null);
  const [books, setBooks] = useState([]);
  const [error, setError] = useState(null);
  const { id } = useParams();

  useEffect(() => {
    const fetchHistory = async () => {
      if (!id) {
        setLoading(false);
        return;
      }

      const token = localStorage.getItem("token");
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        console.log('Fetching data for member ID:', id);

        const [memberRes, historyRes, booksRes, finesRes] = await Promise.all([
          axios.get(`${API_URL}member/${id}`, {
            headers: { 
              Authorization: `Bearer ${token}`,
              Accept: 'application/json'
            }
          }),
          axios.get(`${API_URL}peminjaman`, {
            headers: { 
              Authorization: `Bearer ${token}`,
              Accept: 'application/json'
            }
          }),
          axios.get(`${API_URL}buku`, {
            headers: { 
              Authorization: `Bearer ${token}`,
              Accept: 'application/json'
            }
          }),
          axios.get(`${API_URL}denda`, {
            headers: { 
              Authorization: `Bearer ${token}`,
              Accept: 'application/json'
            }
          })
        ]);

        // Set data immediately after receiving responses
        setMember(memberRes.data.data || memberRes.data);
        setBooks(booksRes.data.data || []);

        // Filter and set history
        const lendingData = historyRes.data.data || [];
        const memberHistory = lendingData.filter(
          lending => String(lending.id_member) === String(id)
        );
        setHistory(memberHistory);

        // Filter and set fines
        const finesData = finesRes.data.data || [];
        const memberFines = finesData.filter(
          fine => String(fine.id_member) === String(id)
        );
        setFines(memberFines);

      } catch (err) {
        console.error("Error fetching data:", err);
        setError(err.response?.data?.message || "Failed to load data");
      } finally {
        // Always set loading to false when done
        setLoading(false);
      }
    };

    // Reset loading when id changes
    setLoading(true);
    fetchHistory();
  }, [id]);

  // Add total fines calculation
  const totalFines = fines.reduce((sum, fine) => sum + Number(fine.jumlah_denda), 0);

  if (loading) return (
    <div className="flex justify-center items-center h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  );

  if (error) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {member && (
        <div className="mb-6">
          <h2 className="text-2xl font-bold">Riwayat Peminjaman - {member.nama}</h2>
          <div className="mt-2 flex gap-4">
            <p className="text-gray-600">Total Peminjaman: {history.length}</p>
            <p className="text-red-600">Total Denda: Rp {totalFines.toLocaleString()}</p>
          </div>
        </div>
      )}

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Buku
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Tanggal Pinjam
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Tanggal Kembali
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {history.length === 0 ? (
              <tr>
                <td colSpan="4" className="px-6 py-4 text-center text-gray-500">
                  Tidak ada riwayat peminjaman
                </td>
              </tr>
            ) : (
              history.map((item) => (
                <tr key={item.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {books.find(b => b.id === item.id_buku)?.judul || item.id_buku}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{item.tgl_pinjam}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{item.tgl_pengembalian}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold
                      ${Number(item.status) === 1 ? 'bg-green-100 text-green-800' : 
                        Number(item.status) === 2 ? 'bg-red-100 text-red-800' : 
                        'bg-blue-100 text-blue-800'}`}>
                      {Number(item.status) === 1 ? 'Dikembalikan' : 
                       Number(item.status) === 2 ? 'Terlambat' : 'Dipinjam'}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add fines history table */}
      {fines.length > 0 && (
        <div className="mt-8">
          <h3 className="text-xl font-bold mb-4">Riwayat Denda</h3>
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Buku
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Jenis Denda
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Jumlah
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Deskripsi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {fines.map((fine) => (
                  <tr key={fine.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {books.find(b => b.id === fine.id_buku)?.judul || fine.id_buku}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap capitalize">
                      {fine.jenis_denda}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      Rp {Number(fine.jumlah_denda).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {fine.deskripsi}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}