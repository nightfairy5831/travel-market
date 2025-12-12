export default function PathSelector({ setSelectedPath }) {
  return (
    <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded">
      {/* <h2 className="text-xl font-semibold mb-3">Choose System Path</h2> */}
      <div className="flex flex-col gap-3">
        <button
          className="p-3 bg-blue-600 text-white rounded hover:bg-blue-700"
          onClick={() => setSelectedPath(1)}
        >
          I have already booked my flight
        </button>
        <button
          className="p-3 bg-green-600 text-white rounded hover:bg-green-700"
          onClick={() => setSelectedPath(2)}
        >
          I haven’t booked my flight yet
        </button>
      </div>
    </div>
  );
}
