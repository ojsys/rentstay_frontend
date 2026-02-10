const VacancyReport = ({ data }) => {
  if (!data?.summary) return <p className="text-dark-600 text-sm">No vacancy data available.</p>;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card text-center">
          <p className="text-2xl font-bold">{data.summary.total}</p>
          <p className="text-xs text-dark-600">Total Properties</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold text-green-600">{data.summary.rented}</p>
          <p className="text-xs text-dark-600">Rented</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold text-amber-600">{data.summary.available}</p>
          <p className="text-xs text-dark-600">Available</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold text-primary">{data.summary.vacancy_rate}%</p>
          <p className="text-xs text-dark-600">Vacancy Rate</p>
        </div>
      </div>
      {data.properties?.length > 0 && (
        <div className="card">
          <h3 className="font-semibold text-dark-900 mb-3">By Property</h3>
          <div className="space-y-2">
            {data.properties.map(p => (
              <div key={p.id} className="flex items-center justify-between p-2 rounded border">
                <span className="text-sm text-dark-900">{p.title}</span>
                <span className={`px-2 py-0.5 rounded text-xs font-medium capitalize ${p.is_vacant ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
                  {p.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default VacancyReport;
