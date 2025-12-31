import { Outlet } from 'react-router-dom';
import BranchNavbar from './BranchNavbar';
import BranchSidebar from './BranchSidebar';

const BranchLayout = () => {
  return (
    <div className="flex h-screen overflow-hidden bg-gray-100">
      {/* Sidebar - Full Height */}
      <BranchSidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Navbar - Sticky Top */}
        <BranchNavbar />

        {/* Page Content - Scrollable */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default BranchLayout;
