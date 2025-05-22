import { useEffect, useState } from "react";
import axios from "axios";
import { Pencil, Trash2, Plus } from "lucide-react";
import Modal from "../../components/Modal";

export default function MemberIndex() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showModal, setShowModal] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [formData, setFormData] = useState({
    nama: "",
    email: "",
    password: "",
    alamat: "",
    no_ktp: "",
    tgl_lahir: "",
  });

  const [deleteTarget, setDeleteTarget] = useState(null);

  const API_URL = "http://45.64.100.26:88/perpus-api/public/api/member";
  const token = localStorage.getItem("token");
  const authHeader = {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    }, 
  };

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const res = await axios.get(API_URL, authHeader);
      console.log("FETCH MEMBERS RESPONSE:", res.data);
      setMembers(
        Array.isArray(res.data)
          ? res.data
          : Array.isArray(res.data.data)
          ? res.data.data
          : []
      );
    } catch (err) {
      setError({ message: err.response?.data?.message || err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const handleInputChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const openAddModal = () => {
    setFormData({
      nama: "",
      email: "",
      password: "",
      alamat: "",
      no_ktp: "",
      tgl_lahir: "",
    });
    setEditingMember(null);
    setShowModal(true);
  };

  const openEditModal = (member) => {
    setFormData({
      nama: member.nama || "",
      email: member.email || "",
      password: "",
      alamat: member.alamat || "",
      no_ktp: member.no_ktp || "",
      tgl_lahir: member.tgl_lahir || "",
    });
    setEditingMember(member);
    setShowModal(true);
  };

  const handleSubmit = async () => {
    const { nama, email, password, alamat, no_ktp, tgl_lahir } = formData;

    if (!nama || !email || (!editingMember && !password)) {
      alert("Nama, email, dan password (untuk member baru) harus diisi.");
      return;
    }

    try {
      if (editingMember) {
        const payload = { nama, email, alamat, no_ktp, tgl_lahir };
        if (password) payload.password = password;
        await axios.put(`${API_URL}/${editingMember.id}`, payload, authHeader);
      } else {
        await axios.post(API_URL, { nama, email, password, alamat, no_ktp, tgl_lahir }, authHeader);
      }

      await fetchMembers();
      setShowModal(false);
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await axios.delete(`${API_URL}/${deleteTarget.id}`, authHeader);
      setDeleteTarget(null);
      setShowModal(false);
      fetchMembers();
    } catch (err) {
      alert("Gagal menghapus: " + err.message);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto text-gray-800">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Manajemen Member</h1>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2 rounded bg-white border border-blue-600 text-blue-700 font-semibold shadow hover:bg-blue-50 hover:text-blue-800 transition text-sm"
          style={{ minWidth: 140 }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Tambah
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 p-3 rounded mb-4">
          {error.message}
        </div>
      )}

      {loading ? (
        <p>Memuat data member...</p>
      ) : (
        <div className="bg-white shadow-md rounded overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left">
              <tr>
                <th className="p-4 font-medium">Nama</th>
                {/* <th className="p-4 font-medium">Email</th> */}
                <th className="p-4 font-medium">Alamat</th>
                <th className="p-4 font-medium">No KTP</th>
                <th className="p-4 font-medium">Tanggal Lahir</th>
                <th className="p-4 font-medium">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {members.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-4 text-center text-gray-500">
                    Tidak ada data member
                  </td>
                </tr>
              ) : (
                members.map((member) => (
                  <tr key={member.id} className="border-t hover:bg-gray-50">
                    <td className="p-4">{member.nama}</td>
                    {/* <td className="p-4">{member.email}</td> */}
                    <td className="p-4">{member.alamat}</td>
                    <td className="p-4">{member.no_ktp}</td>
                    <td className="p-4">{member.tgl_lahir}</td>
                    <td className="p-4 flex gap-2">
                      <button
                        onClick={() => openEditModal(member)}
                        className="p-2 rounded bg-yellow-100 hover:bg-yellow-200 text-yellow-800"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(member)}
                        className="p-2 rounded bg-red-100 hover:bg-red-200 text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Tambah/Edit */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingMember ? "Edit Member" : "Tambah Member"}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium">Nama</label>
            <input
              type="text"
              name="nama"
              value={formData.nama}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border rounded mt-1"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border rounded mt-1"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Alamat</label>
            <input
              type="text"
              name="alamat"
              value={formData.alamat}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border rounded mt-1"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">No KTP</label>
            <input
              type="text"
              name="no_ktp"
              value={formData.no_ktp}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border rounded mt-1"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Tanggal Lahir</label>
            <input
              type="date"
              name="tgl_lahir"
              value={formData.tgl_lahir}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border rounded mt-1"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">
              Password {editingMember && <span className="text-gray-400">(Opsional)</span>}
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border rounded mt-1"
              placeholder={editingMember ? "Kosongkan jika tidak diubah" : "Masukkan password"}
            />
          </div>
          <div className="pt-4 text-right">
            <button
              onClick={handleSubmit}
              className="bg-sky-600 text-white px-4 py-2 rounded hover:bg-sky-700"
            >
              {editingMember ? "Simpan" : "Tambah"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal Hapus */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Hapus Member"
      >
        <p className="text-sm">
          Yakin ingin menghapus <strong>{deleteTarget?.nama}</strong>?
        </p>
        <div className="flex justify-end gap-2 mt-6">
          <button
            onClick={() => setDeleteTarget(null)}
            className="px-4 py-2 border rounded hover:bg-gray-100"
          >
            Batal
          </button>
          <button
            onClick={confirmDelete}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Hapus
          </button>
        </div>
      </Modal>
    </div>
  );
}
