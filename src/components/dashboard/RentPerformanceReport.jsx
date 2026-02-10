const RentPerformanceReport = ({ data }) => {
  if (!data?.summary) return <p className="text-dark-600 text-sm">No rent performance data available.</p>;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card text-center">
          <p className="text-2xl font-bold">{data.summary.total_expected}</p>
          <p className="text-xs text-dark-600">Total Expected</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold text-green-600">{data.summary.on_time_rate}%</p>
          <p className="text-xs text-dark-600">On-Time Rate</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold text-primary">{data.summary.collection_rate}%</p>
          <p className="text-xs text-dark-600">Collection Rate</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold text-red-600">{data.summary.unpaid}</p>
          <p className="text-xs text-dark-600">Unpaid</p>
        </div>
      </div>
      <div className="card">
        <h3 className="font-semibold text-dark-900 mb-3">Breakdown</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <p className="text-lg font-bold text-green-600">{data.summary.paid_on_time}</p>
            <p className="text-xs text-dark-600">Paid On Time</p>
          </div>
          <div>
            <p className="text-lg font-bold text-amber-600">{data.summary.paid_late}</p>
            <p className="text-xs text-dark-600">Paid Late</p>
          </div>
          <div>
            <p className="text-lg font-bold">&#8358;{Number(data.summary.collected).toLocaleString()}</p>
            <p className="text-xs text-dark-600">Collected</p>
          </div>
          <div>
            <p className="text-lg font-bold">&#8358;{Number(data.summary.total_amount).toLocaleString()}</p>
            <p className="text-xs text-dark-600">Total Amount</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RentPerformanceReport;
