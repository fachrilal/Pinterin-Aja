import React, { useEffect, useState } from "react";
import axios from "axios";
import { API_URL } from "../../constan";
import { useNavigate } from "react-router-dom";

export default function Lending() {
  const [lendings, setLendings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [showFineModal, setShowFineModal] = useState(false);
  const [selectedLending, setSelectedLending] = useState(null);
  const [fineForm, setFineForm] = useState({
    jumlah_denda: "",
    jenis_denda: "terlambat",
    deskripsi: "",
  });
  const [members, setMembers] = useState([]);
  const [books, setBooks] = useState([]);
  const [form, setForm] = useState({
    id_member: "",
    id_buku: "",
    tgl_pinjam: "",
    tgl_pengembalian: "",
  });
  const [search, setSearch] = useState("");
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailLending, setDetailLending] = useState(null);
  const [returnedIds, setReturnedIds] = useState(new Set());
  const [alert, setAlert] = useState({ message: "", type: "" });
  const navigate = useNavigate();

  // Fix fetchLendings function to handle member-specific data
  const fetchLendings = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      let url = `${API_URL}peminjaman`;
      const memberId = new URLSearchParams(window.location.search).get('member_id');
      if (memberId) {
        url = `${API_URL}peminjaman/${memberId}`;
      }
      const res = await axios.get(url, { 
        headers: { 
          Authorization: `Bearer ${token}`,
          Accept: 'application/json'
        } 
      });
      const lendingData = res.data.data || [];
      const updatedData = lendingData.map(lending => {
        let status = Number(lending.status);
        if (status === 1) return { ...lending, status: 1 };
        const today = new Date().toISOString().split("T")[0];
        const isLate = today > lending.tgl_pengembalian;
        if (isLate) status = 2;
        else status = 0;
        return { ...lending, status };
      });
      setLendings(updatedData);
    } catch (err) {
      console.error("Error fetching:", err);
      setLendings([]);
      setLoading(false); // Tambahkan ini jika belum ada
    }
    finally {
      setLoading(false);
    }
  };

  const fetchMembersAndBooks = async () => {
    try {
      const token = localStorage.getItem("token");
      const [memberRes, bookRes] = await Promise.all([
        axios.get(`${API_URL}member`, { 
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
        })
      ]);
      setMembers(memberRes.data.data || []);
      setBooks(bookRes.data.data || []);
    } catch (err) {
      setMembers([]);
      setBooks([]);
      console.error('Error fetching members and books:', err);
    }
  };

  useEffect(() => {
    fetchLendings();
    fetchMembersAndBooks();
  }, []); // Hapus returnedIds dari dependency

  // Add this after your state declarations
  useEffect(() => {
    console.log('Current lendings:', lendings);
    console.log('Current members:', members);
    console.log('Current books:', books);
  }, [lendings, members, books]);

  // Fix handleAddLending to include proper data structure
  const handleAddLending = async () => {
    const token = localStorage.getItem("token");
    try {
      await axios.post(
        `${API_URL}peminjaman`,
        {
          ...form,
          status: 0 // Add initial status
        },
        { 
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          } 
        }
      );
      setShowAddModal(false);
      setAlert({ message: "Peminjaman berhasil ditambahkan", type: "success" });
      fetchLendings();
    } catch (err) {
      console.error("Error adding lending:", err);
      setAlert({ 
        message: "Gagal menambah peminjaman: " + (err.response?.data?.message || err.message),
        type: "error" 
      });
    }
  };

  // Pengembalian
  const handleOpenReturn = (lending) => {
    setSelectedLending(lending);
    const today = new Date().toISOString().split("T")[0];
    const isLate = lending.status !== 1 && today > lending.tgl_pengembalian;
    if (isLate) {
      // Hitung denda otomatis
      const tglKembali = new Date(lending.tgl_pengembalian);
      const tglHariIni = new Date(today);
      const diffTime = tglHariIni - tglKembali;
      const diffDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
      setFineForm({
        jumlah_denda: diffDays * 1000,
        jenis_denda: "terlambat",
        deskripsi: `Terlambat ${diffDays} hari`,
      });
      setShowFineModal(true);
    } else {
      setShowReturnModal(true);
    }
  };

  // Simpan denda dan lanjutkan pengembalian
  const handleSubmitFine = async () => {
    if (!fineForm.jumlah_denda || !fineForm.jenis_denda) {
      alert("Isi semua data denda!");
      return;
    }
    const token = localStorage.getItem("token");
    try {
      const res = await axios.post(
        `${API_URL}denda`,
        {
          id_member: selectedLending.id_member,
          id_buku: selectedLending.id_buku,
          jumlah_denda: fineForm.jumlah_denda,
          jenis_denda: fineForm.jenis_denda,
          deskripsi: fineForm.deskripsi,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log("Denda response:", res.data);
      setShowFineModal(false);
      setShowReturnModal(true); // Baru tampilkan modal konfirmasi pengembalian
    } catch (err) {
      alert("Gagal menyimpan denda");
    }
  };

  // Fix handleReturnLending function
  const handleReturnLending = async (id) => {
    const token = localStorage.getItem("token");
    const today = new Date().toISOString().split("T")[0];

    try {
      const lending = lendings.find(l => l.id === id);
      if (!lending) return;

      // Update status peminjaman
      await axios.put(
        `${API_URL}peminjaman/pengembalian/${id}`,
        {
          id_peminjaman: id,
          tgl_pengembalian: today,
          status: 1
        },
        { 
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          } 
        }
      );

      // Jika terlambat, buat denda
      const isLate = today > lending.tgl_pengembalian;
      if (isLate) {
        const diffTime = new Date(today) - new Date(lending.tgl_pengembalian);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        await axios.post(
          `${API_URL}denda`,
          {
            id_peminjaman: id,
            id_member: lending.id_member,
            id_buku: lending.id_buku,
            jumlah_denda: diffDays * 1000,
            jenis_denda: 'terlambat',
            deskripsi: `Terlambat ${diffDays} hari`,
          },
          { 
            headers: { 
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            } 
          }
        );
      }

      setShowReturnModal(false);
      setAlert({ 
        message: `Buku berhasil dikembalikan${isLate ? ' dengan denda' : ''}`, 
        type: 'success' 
      });

      // Fetch ulang agar status benar-benar update dari API
      await fetchLendings();

    } catch (err) {
      setAlert({ 
        message: "Gagal mengembalikan buku: " + (err.response?.data?.message || err.message),
        type: "error" 
      });
    }
  };

  // Filter
  const filteredLendings = lendings.filter(lending => {
    const member = members.find(m => m.id === lending.id_member);
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      (member && member.nama.toLowerCase().includes(searchLower)) ||
      String(lending.id_member).includes(search)
    );
  });

  // Modify status display logic in the table
  const getStatusDisplay = (lending) => {
    const today = new Date().toISOString().split("T")[0];
    const isLate = today > lending.tgl_pengembalian;
    const daysLeft = Math.ceil((new Date(lending.tgl_pengembalian) - new Date()) / (1000 * 60 * 60 * 24));

    if (Number(lending.status) === 1) {
      return (
        <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-semibold">
          Buku sudah dikembalikan
        </span>
      );
    }
    if (Number(lending.status) === 2 || isLate) {
      return (
        <>
          <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-semibold animate-pulse">
            Terlambat
          </span>
          <div className="text-xs text-red-400 mt-1">
            Terlambat: {Math.abs(daysLeft)} hari
          </div>
        </>
      );
    }
    return (
      <>
        <span className="bg-gray-200 text-gray-700 px-3 py-1 rounded-full text-xs font-semibold">
          Dipinjam
        </span>
        <div className="text-xs text-gray-400 mt-1">
          Sisa waktu: {daysLeft} hari
        </div>
      </>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  console.log('Rendering with data:', { lendings, members, books }); // Debug log

  return (
    <div className="p-6 max-w-5xl mx-auto text-gray-800">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Daftar Peminjaman</h1>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Cari nama member..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-200 text-sm"
            style={{ minWidth: 220 }}
          />
          <button
            onClick={() => {
              setShowAddModal(true);
              fetchMembersAndBooks(); // Pastikan fetch data setiap buka modal
            }}
            className="flex items-center gap-2 px-4 py-2 rounded bg-white border border-blue-600 text-blue-700 font-semibold shadow hover:bg-blue-50 hover:text-blue-800 transition text-sm"
            style={{ minWidth: 140 }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Tambah
          </button>
        </div>
      </div>

      <div className="bg-white shadow-md rounded overflow-hidden border border-gray-200">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="p-4 font-medium text-center">Nama Member</th>
              <th className="p-4 font-medium text-center">Judul Buku</th>
              <th className="p-4 font-medium text-center">Tanggal Pinjam</th>
              <th className="p-4 font-medium text-center">Tanggal Kembali</th>
              <th className="p-4 font-medium text-center">Status</th>
              <th className="p-4 font-medium text-center">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filteredLendings.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-10 text-center text-gray-500">
                  Tidak ada data peminjaman
                </td>
              </tr>
            ) : (
              filteredLendings.map((lending) => (
                <tr key={lending.id} className="border-t hover:bg-gray-50">
                  <td className="p-4 text-center">{members.find(m => m.id === lending.id_member)?.nama || lending.id_member}</td>
                  <td className="p-4 text-center">{books.find(b => b.id === lending.id_buku)?.judul || lending.id_buku}</td>
                  <td className="p-4 text-center">{lending.tgl_pinjam}</td>
                  <td className="p-4 text-center">{lending.tgl_pengembalian}</td>
                  <td className="p-4 text-center">
                    {getStatusDisplay(lending)}
                  </td>
                  <td className="p-4 flex justify-center gap-2">
                    <button
                      onClick={() => {
                        setDetailLending(lending);
                        setShowDetailModal(true);
                      }}
                      className="px-4 py-1 rounded bg-white border border-gray-400 text-gray-700 text-xs font-semibold shadow hover:bg-gray-100 transition"
                    >
                      Detail
                    </button>
                    {Number(lending.status) !== 1 && (
                      <button
                        onClick={() => handleOpenReturn(lending)}
                        className="px-4 py-1 rounded bg-gray-800 text-white text-xs font-semibold shadow hover:bg-gray-900 transition"
                      >
                        Kembalikan
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Tambah Peminjaman */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl border border-gray-200">
            <h2 className="text-xl font-bold mb-6 text-gray-900">Tambah Peminjaman</h2>
            {(members.length === 0 || books.length === 0) ? (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                <span className="ml-4 text-gray-600">Memuat data...</span>
              </div>
            ) : (
              <form>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium">Member</label>
                    <select
                      className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-200"
                      value={form.id_member}
                      onChange={(e) => setForm({ ...form, id_member: e.target.value })}
                    >
                      <option value="">Pilih Member</option>
                      {members.map((m) => (
                        <option key={m.id} value={m.id}>{m.nama}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium">Buku</label>
                    <select
                      className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-200"
                      value={form.id_buku}
                      onChange={(e) => setForm({ ...form, id_buku: e.target.value })}
                    >
                      <option value="">Pilih Buku</option>
                      {books.map((b) => (
                        <option key={b.id} value={b.id}>{b.judul}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label className="block text-sm font-medium">Tanggal Pinjam</label>
                      <input
                        type="date"
                        className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-200"
                        value={form.tgl_pinjam}
                        onChange={(e) => setForm({ ...form, tgl_pinjam: e.target.value })}
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-sm font-medium">Tanggal Kembali</label>
                      <input
                        type="date"
                        className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-200"
                        value={form.tgl_pengembalian}
                        onChange={(e) => setForm({ ...form, tgl_pengembalian: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              </form>
            )}
            <div className="flex justify-end gap-2 mt-8">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 border rounded hover:bg-gray-100"
              >
                Batal
              </button>
              <button
                onClick={handleAddLending}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Denda */}
      {showFineModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl border border-gray-200">
            <h2 className="text-xl font-bold mb-6 text-gray-900">Input Denda</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium">Jumlah Denda</label>
                <input
                  type="number"
                  className="w-full border border-gray-300 rounded px-3 py-2 mt-1"
                  value={fineForm.jumlah_denda}
                  onChange={e => setFineForm({ ...fineForm, jumlah_denda: e.target.value })}
                  placeholder="Masukkan jumlah denda"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Jenis Denda</label>
                <select
                  className="w-full border border-gray-300 rounded px-3 py-2 mt-1"
                  value={fineForm.jenis_denda}
                  onChange={e => setFineForm({ ...fineForm, jenis_denda: e.target.value })}
                >
                  <option value="terlambat">Terlambat</option>
                  <option value="kerusakan">Kerusakan</option>
                  <option value="lainnya">Lainnya</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium">Deskripsi</label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded px-3 py-2 mt-1"
                  value={fineForm.deskripsi}
                  onChange={e => setFineForm({ ...fineForm, deskripsi: e.target.value })}
                  placeholder="Deskripsi denda"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-8">
              <button
                onClick={() => setShowFineModal(false)}
                className="px-4 py-2 border rounded hover:bg-gray-100"
              >
                Batal
              </button>
              <button
                onClick={handleSubmitFine}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Simpan & Lanjutkan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Kembalikan Buku */}
      {showReturnModal && selectedLending && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 w-full max-w-sm shadow-2xl border border-gray-200">
            <h2 className="text-lg font-bold mb-4 text-gray-900">Konfirmasi Pengembalian</h2>
            <p className="mb-6 text-gray-700">
              Yakin ingin mengembalikan buku untuk <b>
                {members.find(m => m.id === selectedLending.id_member)?.nama || selectedLending.id_member}
              </b>?
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowReturnModal(false)}
                className="px-4 py-2 border rounded hover:bg-gray-100"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  handleReturnLending(selectedLending.id);
                  // setShowReturnModal(false); // Sudah di-handle di handleReturnLending
                }}
                className="bg-gray-800 text-white px-4 py-2 rounded hover:bg-gray-900"
              >
                Kembalikan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Detail Peminjaman */}
      {showDetailModal && detailLending && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 w-full max-w-sm shadow-2xl border border-gray-200">
            <h2 className="text-lg font-bold mb-4 text-gray-900">Detail Peminjaman</h2>
            <div className="space-y-2 text-sm text-gray-700">
              <div>
                <span className="font-semibold">Nama Member:</span>{" "}
                {members.find(m => m.id === detailLending.id_member)?.nama || detailLending.id_member}
              </div>
              <div>
                <span className="font-semibold">Judul Buku:</span>{" "}
                {books.find(b => b.id === detailLending.id_buku)?.judul || detailLending.id_buku}
              </div>
              <div>
                <span className="font-semibold">Tanggal Pinjam:</span>{" "}
                {detailLending.tgl_pinjam}
              </div>
              <div>
                <span className="font-semibold">Tanggal Kembali:</span>{" "}
                {detailLending.tgl_pengembalian}
              </div>
              <div>
                <span className="font-semibold">Status:</span>{" "}
                {detailLending.status === 1 ? "Dikembalikan" : "Dipinjam"}
              </div>
              {detailLending.status === 1 && detailLending.tgl_pengembalian && (
                <div>
                  <span className="font-semibold">Tanggal Pengembalian:</span>{" "}
                  {detailLending.tgl_pengembalian}
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2 mt-8">
              <button
                onClick={() => setShowDetailModal(false)}
                className="px-4 py-2 border rounded hover:bg-gray-100"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
