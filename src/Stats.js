import { useEffect } from "react";
import Chart from "chart.js/auto";

const Stats = ({ entries }) => {
  useEffect(() => {
    const packageCtx = document.getElementById("packageChart").getContext("2d");
    new Chart(packageCtx, {
      type: "doughnut",
      data: {
        labels: ["Premium", "Basic"],
        datasets: [
          {
            data: [
              entries.filter((e) => e.package === "premium").length,
              entries.filter((e) => e.package === "basic").length,
            ],
            backgroundColor: ["rgba(245, 158, 11, 0.7)", "rgba(16, 185, 129, 0.7)"],
          },
        ],
      },
      options: { responsive: true, plugins: { legend: { position: "bottom" } } },
    });
    // Weitere Diagramme (Status, monatliche Registrierungen)
  }, [entries]);

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-bold mb-4">Statistiken</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-medium mb-3">Paketverteilung</h3>
          <div className="h-80">
            <canvas id="packageChart"></canvas>
          </div>
        </div>
        {/* Weitere Diagramme */}
      </div>
    </div>
  );
};
