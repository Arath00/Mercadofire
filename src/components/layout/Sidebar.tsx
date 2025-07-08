import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Tags, 
  Package2, 
  ClipboardList, 
  PieChart,
  Menu,
  X
} from 'lucide-react';

const Sidebar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(true);

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  return (
    <>
      {/* Mobile menu button */}
      <button
        className="lg:hidden fixed z-50 bottom-4 right-4 p-3 rounded-full bg-blue-600 text-white shadow-lg"
        onClick={toggleSidebar}
      >
        {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      {/* Sidebar */}
      <div
        className={`bg-white border-r border-gray-200 h-full w-64 fixed lg:static transition-all duration-300 z-40 ${
          isOpen ? 'left-0' : '-left-64'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-center h-16 border-b border-gray-200">
            <h1 className="text-xl font-bold text-blue-600">MiniSuper</h1>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-4">
            <ul className="space-y-1">
              <li>
                <NavLink
                  to="/"
                  className={({ isActive }) =>
                    `flex items-center px-4 py-3 text-sm font-medium ${
                      isActive
                        ? 'text-blue-600 bg-blue-50'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`
                  }
                  onClick={() => setIsOpen(false)}
                >
                  <LayoutDashboard className="h-5 w-5 mr-3" />
                  Dashboard
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/categories"
                  className={({ isActive }) =>
                    `flex items-center px-4 py-3 text-sm font-medium ${
                      isActive
                        ? 'text-blue-600 bg-blue-50'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`
                  }
                  onClick={() => setIsOpen(false)}
                >
                  <Tags className="h-5 w-5 mr-3" />
                  Categorías
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/products"
                  className={({ isActive }) =>
                    `flex items-center px-4 py-3 text-sm font-medium ${
                      isActive
                        ? 'text-blue-600 bg-blue-50'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`
                  }
                  onClick={() => setIsOpen(false)}
                >
                  <Package2 className="h-5 w-5 mr-3" />
                  Productos
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/inventory"
                  className={({ isActive }) =>
                    `flex items-center px-4 py-3 text-sm font-medium ${
                      isActive
                        ? 'text-blue-600 bg-blue-50'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`
                  }
                  onClick={() => setIsOpen(false)}
                >
                  <ClipboardList className="h-5 w-5 mr-3" />
                  Inventario
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/reports"
                  className={({ isActive }) =>
                    `flex items-center px-4 py-3 text-sm font-medium ${
                      isActive
                        ? 'text-blue-600 bg-blue-50'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`
                  }
                  onClick={() => setIsOpen(false)}
                >
                  <PieChart className="h-5 w-5 mr-3" />
                  Reportes
                </NavLink>
              </li>
            </ul>
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200">
            <p className="text-xs text-gray-500">© 2025 MiniSuper Inventory</p>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;