import React, { useEffect, useState } from "react";
import axios from "axios";
import { API_URL } from "../../constan";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

export default function FinePage() {
  const [fines, setFines] = useState([]);
  const [members, setMembers] = useState([]);
  const [books, setBooks] = useState([]);
  const [lendings, setLendings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    id_member: "",
    id_buku: "",
    jumlah_denda: "",
    jenis_denda: "terlambat",
    deskripsi: "",
  });
  const [success, setSuccess] = useState("");
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;

  // State untuk member yang dipilih untuk melihat riwayat peminjaman
  const [selectedMemberForLending, setSelectedMemberForLending] = useState("");

  // Fetch all data
  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      setError("");
      try {
        const token = localStorage.getItem("token");
        const [fineRes, memberRes, bookRes, lendingRes] = await Promise.all([
          axios.get(`${API_URL}denda`, {
            headers: { Authorization: `Bearer ${token}`, Accept: "application/json" }
          }),
          axios.get(`${API_URL}member`, {
            headers: { Authorization: `Bearer ${token}`, Accept: "application/json" }
          }),
          axios.get(`${API_URL}buku`, {
            headers: { Authorization: `Bearer ${token}`, Accept: "application/json" }
          }),
          axios.get(`${API_URL}peminjaman`, {
            headers: { Authorization: `Bearer ${token}`, Accept: "application/json" }
          }),
        ]);
        setFines(fineRes.data.data || []);
        setMembers(Array.isArray(memberRes.data) ? memberRes.data : (memberRes.data.data || []));
        setBooks(Array.isArray(bookRes.data) ? bookRes.data : (bookRes.data.data || []));
        setLendings(Array.isArray(lendingRes.data) ? lendingRes.data : (lendingRes.data.data || []));
        console.log("Fines:", fineRes.data.data);
        console.log("Members:", Array.isArray(memberRes.data) ? memberRes.data : memberRes.data.data);
        console.log("Books:", Array.isArray(bookRes.data) ? bookRes.data : bookRes.data.data);
      } catch (err) {
        setError("Gagal mengambil data");
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  // Handle form submit (POST denda)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    try {
      const token = localStorage.getItem("token");
      await axios.post(`${API_URL}denda`, form, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      setSuccess("Denda berhasil ditambahkan");
      setForm({
        id_member: "",
        id_buku: "",
        jumlah_denda: "",
        jenis_denda: "terlambat",
        deskripsi: "",
      });
      // Refresh data
      const fineRes = await axios.get(`${API_URL}denda`, {
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" }
      });
      setFines(fineRes.data.data || []);
    } catch (err) {
      setError("Gagal menambah denda");
      console.error("Error adding fine:", err);
    }
  };

  // Helper untuk tampilkan nama member/buku
  const getMemberName = (id) => members.find((m) => m.id === id)?.nama || id;
  const getBookTitle = (id) => books.find((b) => b.id === id)?.judul || id;

  // Tambahkan fungsi ini di dalam FinePage
  const handleAutoFill = (changedField, value) => {
    let newForm = { ...form, [changedField]: value };

    const selectedMember = changedField === "id_member" ? value : form.id_member;
    const selectedBook = changedField === "id_buku" ? value : form.id_buku;
    let jenisDenda = changedField === "jenis_denda" ? value : form.jenis_denda;

    const lending = lendings.find(
      l => String(l.id_member) === String(selectedMember) && String(l.id_buku) === String(selectedBook)
    );

    let jumlahDenda = "";
    let deskripsi = "";

    if (lending) {
      const today = new Date().toISOString().split("T")[0];
      let telat = 0;
      if (today > lending.tgl_pengembalian) {
        const tglKembali = new Date(lending.tgl_pengembalian);
        const tglHariIni = new Date(today);
        const diffTime = tglHariIni - tglKembali;
        telat = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
      }

      if (telat > 0) {
        // Default ke terlambat jika telat
        if (changedField === "id_member" || changedField === "id_buku") {
          jenisDenda = "terlambat";
        }
        if (jenisDenda === "terlambat" || (jenisDenda === "kerusakan" && telat > 0)) {
          jumlahDenda = telat * 1000;
          deskripsi = `Terlambat ${telat} hari`;
          if (jenisDenda === "kerusakan") {
            jumlahDenda = Number(jumlahDenda) + 5000;
            deskripsi = (deskripsi ? deskripsi + " & " : "") + "Kerusakan buku";
          }
        }
      } else {
        // Tidak telat, kosongkan field denda
        jenisDenda = "";
        jumlahDenda = "";
        deskripsi = "";
      }
    } else {
      // Default jika tidak ada lending
      if (jenisDenda === "terlambat") {
        jumlahDenda = 1000;
        deskripsi = "Denda keterlambatan";
      } else if (jenisDenda === "kerusakan") {
        jumlahDenda = 5000;
        deskripsi = "Kerusakan buku";
      } else {
        jumlahDenda = "";
        deskripsi = "";
      }
    }

    newForm.jenis_denda = jenisDenda;
    newForm.jumlah_denda = jumlahDenda;
    newForm.deskripsi = deskripsi;

    setForm(newForm);
  };

  const exportFinePDF = (memberId) => {
    console.log("Export PDF untuk memberId:", memberId);
    const member = members.find(m => String(m.id) === String(memberId));
    const data = fines
      .filter(f => String(f.id_member) === String(memberId))
      .map((fine, idx) => [
        idx + 1,
        getBookTitle(fine.id_buku),
        fine.jenis_denda,
        `Rp ${Number(fine.jumlah_denda).toLocaleString("id-ID")}`,
        fine.deskripsi
      ]);
    console.log("Data yang akan diexport:", data);

    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(`Riwayat Denda: ${member?.nama || memberId}`, 14, 18);

    autoTable(doc, {
      head: [["No", "Judul Buku", "Jenis Denda", "Jumlah", "Deskripsi"]],
      body: data,
      startY: 25,
      styles: { halign: "center", valign: "middle" },
      headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: "bold" },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      tableLineColor: [0, 0, 0],
      tableLineWidth: 0.1,
    });
    

    doc.save(`riwayat_denda_${member?.nama || memberId}.pdf`);
  };

  const paginatedFines = fines.slice((page - 1) * itemsPerPage, page * itemsPerPage);
  const totalPages = Math.ceil(fines.length / itemsPerPage);

  // Filter data peminjaman berdasarkan member yang dipilih
  const lendingHistory = lendings.filter(
    l => String(l.id_member) === String(selectedMemberForLending)
  );

  return (
    <div className="p-6 max-w-5xl mx-auto text-gray-800">
      <h1 className="text-2xl font-semibold mb-6">Data Denda</h1>

      {/* Form Tambah Denda */}
      <div className="bg-white rounded-2xl shadow-md border border-gray-200 mb-8 p-8">
        <h2 className="text-lg font-bold mb-4 text-gray-900">Tambah Denda</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block font-medium mb-1">Member</label>
            <select
              className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-200"
              value={form.id_member}
              onChange={e => handleAutoFill("id_member", e.target.value)}
              required
            >
              <option value="">Pilih Member</option>
              {members.map(m => (
                <option key={m.id} value={m.id}>
                  {m.id} - {m.nama}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block font-medium mb-1">Buku</label>
            <select
              className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-200"
              value={form.id_buku}
              onChange={e => handleAutoFill("id_buku", e.target.value)}
              required
            >
              <option value="">Pilih Buku</option>
              {books.map(b => (
                <option key={b.id} value={b.id}>
                  {b.id} - {b.judul}
                </option>
              ))}
            </select>
          </div>
          {form.jenis_denda && (
            <>
              <div>
                <label className="block font-medium mb-1">Jumlah Denda</label>
                <input
                  type="number"
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-200"
                  value={form.jumlah_denda}
                  onChange={e => setForm({ ...form, jumlah_denda: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block font-medium mb-1">Deskripsi</label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-200"
                  value={form.deskripsi}
                  onChange={e => setForm({ ...form, deskripsi: e.target.value })}
                  required
                />
              </div>
            </>
          )}
          {form.jenis_denda && (
            <div>
              <label className="block font-medium mb-1">Jenis Denda</label>
              <select
                className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-200"
                value={form.jenis_denda}
                onChange={e => handleAutoFill("jenis_denda", e.target.value)}
                required
              >
                <option value="terlambat">Terlambat</option>
                <option value="kerusakan">Kerusakan</option>
                <option value="lainnya">Lainnya</option>
              </select>
            </div>
          )}
          <div className="flex justify-end gap-2 mt-8">
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Simpan Denda
            </button>
          </div>
          {success && <div className="text-green-600 mt-2">{success}</div>}
          {error && <div className="text-red-600 mt-2">{error}</div>}
        </form>
      </div>

      {/* Export PDF */}
      <div className="flex items-center gap-2 mb-6">
        <select
          className="border rounded px-3 py-2"
          value={form.id_member}
          onChange={e => setForm({ ...form, id_member: e.target.value })}
        >
          <option value="">Pilih Member untuk Export PDF</option>
          {members.map(m => (
            <option key={m.id} value={m.id}>{m.nama}</option>
          ))}
        </select>
        <button
          onClick={() => exportFinePDF(form.id_member)}
          disabled={!form.id_member}
          className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 disabled:opacity-50"
        >
          Export PDF Denda Member
        </button>
      </div>

      {/* Tabel Denda */}
      <div className="bg-white rounded-2xl shadow-md border border-gray-200 overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">ID</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Member</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Buku</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Jenis Denda</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Jumlah</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Deskripsi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                  Loading...
                </td>
              </tr>
            ) : fines.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                  Tidak ada data denda
                </td>
              </tr>
            ) : (
              paginatedFines.map((denda) => (
                <tr key={denda.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-center">{denda.id}</td>
                  <td className="px-6 py-4 text-center">{getMemberName(denda.id_member)}</td>
                  <td className="px-6 py-4 text-center">{getBookTitle(denda.id_buku)}</td>
                  <td className="px-6 py-4 text-center">{denda.jenis_denda}</td>
                  <td className="px-6 py-4 text-center">Rp {Number(denda.jumlah_denda).toLocaleString("id-ID")}</td>
                  <td className="px-6 py-4 text-center">{denda.deskripsi}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-between items-center px-4 py-3 bg-gray-50 border-t">
          <span className="text-sm text-gray-600">
            Halaman {page} dari {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1 rounded border text-sm bg-white hover:bg-gray-100 disabled:opacity-50"
            >
              Prev
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1 rounded border text-sm bg-white hover:bg-gray-100 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Riwayat Peminjaman Member */}
      <div className="mt-8 mb-8">
        <h2 className="text-lg font-bold mb-2 text-gray-900">Riwayat Peminjaman Member</h2>
        <div className="flex items-center gap-2 mb-4">
          <select
            className="border rounded px-3 py-2"
            value={selectedMemberForLending}
            onChange={e => setSelectedMemberForLending(e.target.value)}
          >
            <option value="">Pilih Member</option>
            {members.map(m => (
              <option key={m.id} value={m.id}>{m.nama}</option>
            ))}
          </select>
        </div>
        {selectedMemberForLending && (
          <div className="bg-white rounded-2xl shadow-md border border-gray-200 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">ID</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Buku</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Tanggal Pinjam</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Tanggal Kembali</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {lendingHistory.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                      Tidak ada riwayat peminjaman
                    </td>
                  </tr>
                ) : (
                  lendingHistory.map(l => (
                    <tr key={l.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-center">{l.id}</td>
                      <td className="px-6 py-4 text-center">{getBookTitle(l.id_buku)}</td>
                      <td className="px-6 py-4 text-center">{l.tgl_pinjam}</td>
                      <td className="px-6 py-4 text-center">{l.tgl_pengembalian}</td>
                      <td className="px-6 py-4 text-center">{l.status || "-"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}