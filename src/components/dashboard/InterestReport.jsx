const InterestReport = ({ data }) => {
  if (!data?.summary) return <p className="text-dark-600 text-sm">No interest data available.</p>;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="card text-center">
          <p className="text-2xl font-bold text-indigo-600">
            &#8358;{Number(data.summary.total_held || 0).toLocaleString()}
          </p>
          <p className="text-xs text-dark-600">Total Held</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold text-emerald-600">
            &#8358;{Number(data.summary.total_interest || 0).toLocaleString()}
          </p>
          <p className="text-xs text-dark-600">Total Interest</p>
        </div>
      </div>
      {data.pools?.length > 0 && (
        <div className="card">
          <h3 className="font-semibold text-dark-900 mb-3">Caution Fee Pools</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-dark-600">
                  <th className="py-2 pr-3">Tenant</th>
                  <th className="py-2 pr-3">Property</th>
                  <th className="py-2 pr-3">Deposited</th>
                  <th className="py-2 pr-3">Interest</th>
                  <th className="py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {data.pools.map((p, i) => (
                  <tr key={i} className="border-t border-gray-100">
                    <td className="py-2 pr-3">{p.tenant}</td>
                    <td className="py-2 pr-3">{p.property}</td>
                    <td className="py-2 pr-3">&#8358;{Number(p.deposited).toLocaleString()}</td>
                    <td className="py-2 pr-3 text-emerald-600">&#8358;{Number(p.interest).toLocaleString()}</td>
                    <td className="py-2">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${p.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-dark-600'}`}>
                        {p.is_active ? 'Active' : 'Closed'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default InterestReport;
