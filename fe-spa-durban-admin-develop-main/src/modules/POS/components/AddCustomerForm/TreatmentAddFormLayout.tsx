import { useState } from "react";

type Props = {
  onClose: () => void;
  onSave: (data: any) => void;
};

const TreatmentAddFormWrapper = ({ onClose, onSave }: Props) => {
  const [treatmentName, setTreatmentName] = useState("");
  const [duration, setDuration] = useState("");
  const [price, setPrice] = useState("");

  const handleAddTreatment = () => {
    const data = {
      treatmentName,
      duration,
      price,
    };

    console.log("Treatment Data:", data);

    onSave(data); // parent ko data bhejna
    onClose(); // modal close

    setTreatmentName("");
    setDuration("");
    setPrice("");
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">

      <div className="p-4 bg-white rounded-lg shadow w-[400px] space-y-4">

        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-lg font-semibold">Add Treatment</h2>
            <span className="text-xs text-red-500">
              Add only if an extra treatment/service was performed
            </span>
          </div>

          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-lg"
          >
            ✕
          </button>
        </div>

        {/* Treatment Name */}
        <div>
          <label className="text-sm font-medium">Treatment Name</label>
          <input
            type="text"
            placeholder="Enter treatment name"
            value={treatmentName}
            onChange={(e) => setTreatmentName(e.target.value)}
            className="w-full border rounded p-2 mt-1"
          />
        </div>

        {/* Time */}
        <div>
          <label className="text-sm font-medium">Duration (Minutes)</label>
          <input
            type="number"
            placeholder="30"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            className="w-full border rounded p-2 mt-1"
          />
        </div>

        {/* Price */}
        <div>
          <label className="text-sm font-medium">Price</label>
          <input
            type="number"
            placeholder="Enter price"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="w-full border rounded p-2 mt-1"
          />
        </div>

        <button
          onClick={handleAddTreatment}
          className="w-full bg-primary text-white py-2 rounded"
        >
          Add Treatment
        </button>

      </div>

    </div>
  );
};

export default TreatmentAddFormWrapper;