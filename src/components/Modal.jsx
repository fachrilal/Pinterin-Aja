// src/components/Modal.jsx
export default function Modal({ isOpen, onClose, title, children }) {
    if (!isOpen) return null;
  
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
        role="dialog"
        aria-modal="true"
      >
        <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">{title}</h3>
            <button
              onClick={onClose}
              className="text-gray-600 hover:text-gray-900 font-bold text-xl leading-none"
              aria-label="Close modal"
            >
              &times;
            </button>
          </div>
          <div>{children}</div>
        </div>
      </div>
    );
  }
