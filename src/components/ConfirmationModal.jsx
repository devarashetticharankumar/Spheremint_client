import Modal from "./Modal";

export default function ConfirmationModal({ isOpen, onClose, onConfirm, title, message, confirmText = "Confirm", confirmColor = "red" }) {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title}>
            <div className="space-y-6">
                <p className="text-gray-600">{message}</p>
                <div className="flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => {
                            onConfirm();
                            onClose();
                        }}
                        className={`px-4 py-2 text-white rounded-lg font-bold shadow-md transition ${confirmColor === "red"
                                ? "bg-red-500 hover:bg-red-600 shadow-red-500/20"
                                : "bg-blue-500 hover:bg-blue-600 shadow-blue-500/20"
                            }`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </Modal>
    );
}
