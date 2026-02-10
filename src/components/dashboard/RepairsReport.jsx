const RepairsReport = ({ data }) => {
  if (!data?.summary) return <p className="text-dark-600 text-sm">No repairs data available.</p>;

  return (
    <div className="space-y-4">
      <div className="card">
        <h3 className="font-semibold text-dark-900 mb-3">Total: {data.summary.total} requests</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <h4 className="text-sm font-medium text-dark-700 mb-2">By Priority</h4>
            {Object.entries(data.summary.by_priority || {}).map(([k, v]) => (
              <div key={k} className="flex items-center justify-between py-1">
                <span className="text-sm capitalize text-dark-600">{k}</span>
                <div className="flex items-center gap-2">
                  <div className="h-2 rounded-full bg-primary" style={{ width: `${Math.max(8, (v / Math.max(data.summary.total, 1)) * 100)}px` }} />
                  <span className="text-sm font-medium">{v}</span>
                </div>
              </div>
            ))}
          </div>
          <div>
            <h4 className="text-sm font-medium text-dark-700 mb-2">By Status</h4>
            {Object.entries(data.summary.by_status || {}).map(([k, v]) => (
              <div key={k} className="flex items-center justify-between py-1">
                <span className="text-sm capitalize text-dark-600">{k.replace('_', ' ')}</span>
                <span className="text-sm font-medium">{v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RepairsReport;
