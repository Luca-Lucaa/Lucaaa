import { Link } from "react-router-dom";

const Sidebar = () => (
  <div className="sidebar bg-white text-gray-800 shadow-lg w-64 flex flex-col h-screen">
    <div className="p-4 flex items-center border-b border-gray-200">
      <i className="fas fa-tv text-blue-500 text-2xl mr-3"></i>
      <span className="font-bold text-xl">TV Admin Pro</span>
    </div>
    <div className="p-4 border-b border-gray-200 flex items-center">
      <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">A</div>
      <div className="ml-3">
        <div className="font-medium">Admin</div>
        <div className="text-xs text-gray-500">Administrator</div>
      </div>
    </div>
    <nav className="flex-1 overflow-y-auto p-2">
      <Link to="/subscribers" className="nav-item flex items-center p-3 rounded-lg hover:bg-gray-100">
        <i className="fas fa-users mr-3"></i>
        <span>Abonnenten</span>
      </Link>
      <Link to="/stats" className="nav-item flex items-center p-3 rounded-lg hover:bg-gray-100">
        <i className="fas fa-chart-line mr-3"></i>
        <span>Statistiken</span>
      </Link>
      {/* Weitere Links */}
    </nav>
    <div className="p-4 border-t border-gray-200">
      <button className="flex items-center text-gray-600 hover:text-gray-900">
        <i className="fas fa-sign-out-alt mr-2"></i>
        <span>Abmelden</span>
      </button>
    </div>
  </div>
);
