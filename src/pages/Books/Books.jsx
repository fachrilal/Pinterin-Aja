import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../../constan";
import Modal from "../../components/Modal";

export default function BooksIndex() {
  const [books, setBooks] = useState([]);
  const [error, setError] = useState("");
  const [alert, setAlert] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [modalError, setModalError] = useState("");
  const [formModal, setFormModal] = useState({
    no_rak: "",
    judul: "",
    pengarang: "",
    tahun_terbit: "",
    penerbit: "",
    stok: "",
    kategori: "",
    detail: "",
  });
  const [editId, setEditId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [detailBook, setDetailBook] = useState(null);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState({ type: null, data: null });

  const navigate = useNavigate();

  function fetchData() {
    axios
      .get(`${API_URL}buku`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          Accept: "application/json",
        },
      })
      .then((res) => {
        console.log("API response:", res.data); // Tambahkan ini
        setBooks(res.data);
      })
      .catch((err) => {
        if (err.response && err.response.status === 401) {
          localStorage.removeItem("token");
          navigate("/login");
        }
        setBooks([]);
        setError(
          err.response?.data?.message ||
            err.response?.data?.error ||
            "Failed to fetch books."
        );
      });
  }

  function handleSubmitModal(e) {
    e.preventDefault();
    axios
      .post(`${API_URL}buku`, formModal, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          Accept: "application/json",
        },
      })
      .then(() => {
        setIsAddModalOpen(false);
        setModalError("");
        setAlert({ message: "Successfully added book", type: "success" });
        setFormModal({
          no_rak: "",
          judul: "",
          pengarang: "",
          tahun_terbit: "",
          penerbit: "",
          stok: "",
          kategori: "",
          detail: "",
        });
        fetchData();
      })
      .catch((err) => {
        if (err.response && err.response.status === 401) {
          localStorage.removeItem("token");
          navigate("/login");
        }
        setModalError(
          err.response?.data?.message ||
            err.response?.data?.error ||
            "Failed to add book."
        );
        setAlert({ message: "Failed to add book", type: "error" });
        setTimeout(() => setAlert(""), 3000);
      });
  }

  function handleEditModal(e) {
    e.preventDefault();
    axios
      .post(`${API_URL}buku/${editId}`, { ...formModal, _method: "PUT" }, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          Accept: "application/json",
        },
      })
      .then(() => {
        setIsEditModalOpen(false);
        setModalError("");
        setAlert({ message: "Successfully updated book", type: "success" });
        setFormModal({
          no_rak: "",
          judul: "",
          pengarang: "",
          tahun_terbit: "",
          penerbit: "",
          stok: "",
          kategori: "",
          detail: "",
        });
        fetchData();
      })
      .catch((err) => {
        if (err.response && err.response.status === 401) {
          localStorage.removeItem("token");
          navigate("/login");
        }
        setModalError(
          err.response?.data?.message ||
            err.response?.data?.error ||
            "Failed to update book."
        );
        setAlert({ message: "Failed to update book", type: "error" });
        setTimeout(() => setAlert(""), 3000);
      });
  }

  function handleDeleteBook(e) {
    e.preventDefault();
    axios
      .delete(`${API_URL}buku/${deleteId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          Accept: "application/json",
        },
      })
      .then(() => {
        setIsDeleteModalOpen(false);
        setAlert({ message: "Successfully deleted book", type: "success" });
        fetchData();
      })
      .catch((err) => {
        if (err.response && err.response.status === 401) {
          localStorage.removeItem("token");
          navigate("/login");
        }
        setAlert({ message: "Failed to delete book", type: "error" });
        setTimeout(() => setAlert(""), 3000);
      });
  }

  useEffect(() => {
    fetchData();
  }, []);

  const totalStock = books.reduce(
    (sum, book) => sum + (parseInt(book.stok) || 0),
    0
  );

  const filteredBooks = books.filter((book) => {
    const q = search.toLowerCase();
    return (
      book.judul?.toLowerCase().includes(q) ||
      book.pengarang?.toLowerCase().includes(q) ||
      book.no_rak?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="pt-20 p-4 md:p-8 min-h-screen bg-gray-50">
    
      {/* Tombol Tambah Buku di atas tabel */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <h1 className="text-xl md:text-2xl font-bold text-gray-700">Daftar Buku</h1>
        <div className="flex gap-2 items-center">
          <input
            type="text"
            placeholder="Cari buku..."
            className="px-2 py-1 rounded border border-gray-300 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm"
            style={{ width: "160px" }}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <button
            className="flex items-center gap-2 px-4 py-2 rounded bg-white border border-blue-600 text-blue-700 font-semibold shadow hover:bg-blue-50 hover:text-blue-800 transition text-sm"
            style={{ minWidth: 140 }}
            onClick={() => {
              setFormModal({
                no_rak: "",
                judul: "",
                pengarang: "",
                tahun_terbit: "",
                penerbit: "",
                stok: "",
                kategori: "",
                detail: "",
              });
              setModalError("");
              setIsAddModalOpen(true);
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Tambah Buku
          </button>
        </div>
      </div>

      {/* Info Cards */}
      <div className="flex gap-4 mb-4">
        <div className="flex-1 bg-white rounded shadow p-4 text-center border border-gray-200">
          <div className="text-gray-500 text-xs mb-1">Total Buku</div>
          <div className="text-2xl font-bold text-gray-700">{books.length}</div>
        </div>
        <div className="flex-1 bg-white rounded shadow p-4 text-center border border-gray-200">
          <div className="text-gray-500 text-xs mb-1">Total Stok</div>
          <div className="text-2xl font-bold text-gray-700">{totalStock}</div>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded mb-4 border border-red-200">
          {error}
        </div>
      )}

      {alert && alert.message && (
        <div
          className={`
            flex items-center gap-3 mb-4 px-4 py-2 rounded border-l-4
            ${alert.type === "success"
              ? "border-blue-600 bg-blue-50 text-blue-700"
              : "border-red-600 bg-red-50 text-red-700"}
          `}
        >
          <span className="flex-1">{alert.message}</span>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto bg-white rounded shadow border border-gray-200">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100 text-gray-700">
            <tr>
              <th className="p-2 text-left">No</th>
              <th className="p-2 text-left">Judul</th>
              <th className="p-2 text-left">Pengarang</th>
              <th className="p-2 text-left">Stok</th>
              <th className="p-2 text-left">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filteredBooks.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-8 text-gray-400">
                  Tidak ada buku ditemukan.
                </td>
              </tr>
            ) : (
              filteredBooks.map((book, index) => (
                <tr
                  key={book.id}
                  className="border-t hover:bg-blue-50"
                >
                  <td className="p-2 text-center">{index + 1}</td>
                  <td className="p-2">{book.judul}</td>
                  <td className="p-2">{book.pengarang}</td>
                  <td className="p-2 text-center">{book.stok}</td>
                  <td className="p-2 flex gap-1">
                    <button
                      className="px-2 py-1 rounded bg-gray-200 hover:bg-blue-100 text-blue-700 text-xs"
                      title="Detail"
                      onClick={() => {
                        setDetailBook(book);
                        setIsDetailModalOpen(true);
                      }}
                    >
                      Detail
                    </button>
                    <button
                      className="px-2 py-1 rounded bg-blue-200 hover:bg-blue-400 text-blue-900 text-xs"
                      title="Edit"
                      onClick={() => {
                        setEditId(book.id);
                        setFormModal({
                          no_rak: book.no_rak,
                          judul: book.judul,
                          pengarang: book.pengarang,
                          tahun_terbit: book.tahun_terbit,
                          penerbit: book.penerbit,
                          stok: book.stok,
                          kategori: book.kategori,
                          detail: book.detail,
                        });
                        setModalError("");
                        setIsEditModalOpen(true);
                      }}
                    >
                      Edit
                    </button>
                    <button
                      className="px-2 py-1 rounded bg-red-100 hover:bg-red-300 text-red-700 text-xs"
                      title="Delete"
                      onClick={() => {
                        setDeleteId(book.id);
                        setIsDeleteModalOpen(true);
                      }}
                    >
                      Hapus
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

    {/* Modal Add */}
<Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Tambah Buku" width="max-w-lg">
  <form onSubmit={handleSubmitModal} className="grid grid-cols-1 md:grid-cols-2 gap-4">
    {[
      { id: "no_rak", label: "No Rak" },
      { id: "judul", label: "Judul" },
      { id: "pengarang", label: "Pengarang" },
      { id: "tahun_terbit", label: "Tahun Terbit" },
      { id: "penerbit", label: "Penerbit" },
      { id: "stok", label: "Stok", type: "number", min: 0 },
      { id: "kategori", label: "Kategori" },
    ].map(({ id, label, type = "text", min }) => (
      <div key={id}>
        <label htmlFor={id} className="block text-sm font-medium text-gray-600 mb-1">
          {label}
        </label>
        <input
          id={id}
          type={type}
          min={min}
          className="w-full px-3 py-2 rounded-md border border-gray-300 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={formModal[id]}
          onChange={e => setFormModal({ ...formModal, [id]: e.target.value })}
          required
        />
      </div>
    ))}
    <div className="md:col-span-2">
      <label htmlFor="detail" className="block text-sm font-medium text-gray-600 mb-1">
        Detail
      </label>
      <input
        id="detail"
        type="text"
        className="w-full px-3 py-2 rounded-md border border-gray-300 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        value={formModal.detail}
        onChange={e => setFormModal({ ...formModal, detail: e.target.value })}
        required
      />
    </div>
    {modalError && (
      <div className="md:col-span-2 text-sm text-red-600 bg-red-50 p-2 rounded border border-red-200">
        {modalError}
      </div>
    )}
    <div className="md:col-span-2 flex justify-end gap-2 pt-2">
      <button
        type="button"
        className="px-4 py-2 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm transition"
        onClick={() => setIsAddModalOpen(false)}
      >
        Batal
      </button>
      <button
        type="submit"
        className="px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition"
      >
        Simpan
      </button>
    </div>
  </form>
</Modal>


      {/* Modal Edit */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Buku" width="max-w-lg">
        <form onSubmit={handleEditModal} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-700 text-sm mb-1" htmlFor="no_rak_edit">No Rak</label>
            <input
              id="no_rak_edit"
              type="text"
              className="w-full px-3 py-2 rounded border border-gray-300 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={formModal.no_rak}
              onChange={e => setFormModal({ ...formModal, no_rak: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="block text-gray-700 text-sm mb-1" htmlFor="judul_edit">Judul</label>
            <input
              id="judul_edit"
              type="text"
              className="w-full px-3 py-2 rounded border border-gray-300 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={formModal.judul}
              onChange={e => setFormModal({ ...formModal, judul: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="block text-gray-700 text-sm mb-1" htmlFor="pengarang_edit">Pengarang</label>
            <input
              id="pengarang_edit"
              type="text"
              className="w-full px-3 py-2 rounded border border-gray-300 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={formModal.pengarang}
              onChange={e => setFormModal({ ...formModal, pengarang: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="block text-gray-700 text-sm mb-1" htmlFor="tahun_terbit_edit">Tahun Terbit</label>
            <input
              id="tahun_terbit_edit"
              type="text"
              className="w-full px-3 py-2 rounded border border-gray-300 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={formModal.tahun_terbit}
              onChange={e => setFormModal({ ...formModal, tahun_terbit: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="block text-gray-700 text-sm mb-1" htmlFor="penerbit_edit">Penerbit</label>
            <input
              id="penerbit_edit"
              type="text"
              className="w-full px-3 py-2 rounded border border-gray-300 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={formModal.penerbit}
              onChange={e => setFormModal({ ...formModal, penerbit: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="block text-gray-700 text-sm mb-1" htmlFor="stok_edit">Stok</label>
            <input
              id="stok_edit"
              type="number"
              min="0"
              className="w-full px-3 py-2 rounded border border-gray-300 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={formModal.stok}
              onChange={e => setFormModal({ ...formModal, stok: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="block text-gray-700 text-sm mb-1" htmlFor="kategori_edit">Kategori</label>
            <input
              id="kategori_edit"
              type="text"
              className="w-full px-3 py-2 rounded border border-gray-300 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={formModal.kategori}
              onChange={e => setFormModal({ ...formModal, kategori: e.target.value })}
              required
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-gray-700 text-sm mb-1" htmlFor="detail_edit">Detail</label>
            <input
              id="detail_edit"
              type="text"
              className="w-full px-3 py-2 rounded border border-gray-300 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={formModal.detail}
              onChange={e => setFormModal({ ...formModal, detail: e.target.value })}
              required
            />
          </div>
          {modalError && (
            <div className="md:col-span-2 text-red-500 text-sm">{modalError}</div>
          )}
          <div className="md:col-span-2 flex justify-end gap-2 pt-2">
            <button
              type="button"
              className="px-4 py-2 rounded bg-gray-200 text-gray-700 hover:bg-gray-300 transition"
              onClick={() => setIsEditModalOpen(false)}
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded bg-blue-600 text-white font-semibold hover:bg-blue-700 transition"
            >
              Update
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Delete */}
      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Hapus Buku" width="max-w-md">
        <form onSubmit={handleDeleteBook} className="space-y-4">
          <div className="text-gray-700 text-center text-lg">
            Yakin ingin menghapus buku ini?
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              className="px-4 py-2 rounded bg-gray-200 text-gray-700 hover:bg-gray-300 transition"
              onClick={() => setIsDeleteModalOpen(false)}
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded bg-red-600 text-white font-semibold hover:bg-red-700 transition"
            >
              Hapus
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Detail */}
      <Modal isOpen={isDetailModalOpen} onClose={() => setIsDetailModalOpen(false)} title="Detail Buku" width="max-w-md">
        {detailBook && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-700">
            <div>
              <span className="font-semibold">No Rak:</span>
              <div className="ml-2 break-words">{detailBook.no_rak}</div>
            </div>
            <div>
              <span className="font-semibold">Judul:</span>
              <div className="ml-2 break-words">{detailBook.judul}</div>
            </div>
            <div>
              <span className="font-semibold">Pengarang:</span>
              <div className="ml-2 break-words">{detailBook.pengarang}</div>
            </div>
            <div>
              <span className="font-semibold">Tahun Terbit:</span>
              <div className="ml-2 break-words">{detailBook.tahun_terbit}</div>
            </div>
            <div>
              <span className="font-semibold">Penerbit:</span>
              <div className="ml-2 break-words">{detailBook.penerbit}</div>
            </div>
            <div>
              <span className="font-semibold">Stok:</span>
              <div className="ml-2 break-words">{detailBook.stok}</div>
            </div>
            <div>
              <span className="font-semibold">Kategori:</span>
              <div className="ml-2 break-words">{detailBook.kategori}</div>
            </div>
            <div className="md:col-span-2">
              <span className="font-semibold">Detail:</span>
              <div className="ml-2 whitespace-pre-line break-words max-h-60 overflow-y-auto border border-gray-200 rounded p-2 bg-gray-50">
                {detailBook.detail}
              </div>
            </div>
            <div className="md:col-span-2 flex justify-end pt-2">
              <button
                type="button"
                className="px-4 py-2 rounded bg-gray-200 text-gray-700 hover:bg-gray-300 transition"
                onClick={() => setIsDetailModalOpen(false)}
              >
                Tutup
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
