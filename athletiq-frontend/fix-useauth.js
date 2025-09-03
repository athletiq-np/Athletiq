// Quick fix script to replace useUserStore with useAuth
const fs = require('fs');
const path = require('path');

const filesToFix = [
  'src/pages/admin/AdminDashboard.jsx',
  'src/pages/public/Home.js',
  'src/components/layout/ProtectedRoute.js',
  'src/components/layout/DashboardLayout.js',
  'src/components/layout/Sidebar.js',
  'src/components/features/school/SchoolSidebar.jsx',
  'src/components/features/school/SchoolDashboardLayout.jsx',
  'src/components/features/school/GlobalSchoolDashboard.jsx',
  'src/components/features/admin/GlobalAdminDashboard.jsx'
];

const basePath = 'c:\\Users\\Rahul\\OneDrive\\Desktop\\atheletiq\\Athletiq\\athletiq-frontend\\';

filesToFix.forEach(filePath => {
  const fullPath = path.join(basePath, filePath);
  
  try {
    let content = fs.readFileSync(fullPath, 'utf8');
    
    // Replace import statement
    content = content.replace(
      /import useUserStore from '@\/store\/userStore';?/g,
      "import useAuth from '@/hooks/useAuth';"
    );
    
    // Replace basic usage
    content = content.replace(
      /const { user } = useUserStore\(\);?/g,
      "const { user } = useAuth();"
    );
    
    // Replace with logout
    content = content.replace(
      /const { user, logout } = useUserStore\(\);?/g,
      "const { user, logout } = useAuth();"
    );
    
    // Replace clearUser with logout
    content = content.replace(
      /const { user, clearUser } = useUserStore\(\);?/g,
      "const { user, logout } = useAuth();"
    );
    
    // Replace clearUser() calls with logout()
    content = content.replace(/clearUser\(\)/g, 'logout()');
    
    // Replace specific selectors
    content = content.replace(
      /const clearUser = useUserStore\(\(state\) => state\.clearUser\);?/g,
      "const { logout } = useAuth();"
    );
    
    // Replace isLoading
    content = content.replace(
      /const { user, isLoading } = useUserStore\(\);?/g,
      "const { user, loading } = useAuth();"
    );
    
    content = content.replace(/isLoading/g, 'loading');
    
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`✅ Fixed: ${filePath}`);
  } catch (error) {
    console.error(`❌ Error fixing ${filePath}:`, error.message);
  }
});

console.log('\n🎉 All files processed!');