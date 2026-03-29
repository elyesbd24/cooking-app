import { Outlet, Link, useNavigate } from 'react-router';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';
import { ChefHat, LogOut, User, Heart, PlusCircle, Search, Shield } from 'lucide-react';
import { Toaster } from './ui/sonner';

function Navigation() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <ChefHat className="w-8 h-8 text-orange-500" />
            <span className="text-xl font-bold text-gray-900">RecipeHub</span>
          </Link>

          <div className="flex items-center gap-4">
            <Link to="/search">
              <Button variant="ghost" size="sm">
                <Search className="w-4 h-4 mr-2" />
                Find Recipes
              </Button>
            </Link>

            {user ? (
              <>
                <Link to="/submit">
                  <Button variant="ghost" size="sm">
                    <PlusCircle className="w-4 h-4 mr-2" />
                    Submit Recipe
                  </Button>
                </Link>
                
                <Link to="/favorites">
                  <Button variant="ghost" size="sm">
                    <Heart className="w-4 h-4 mr-2" />
                    Favorites
                  </Button>
                </Link>

                {user.role === 'admin' && (
                  <Link to="/admin">
                    <Button variant="ghost" size="sm">
                      <Shield className="w-4 h-4 mr-2" />
                      Admin
                    </Button>
                  </Link>
                )}

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-md">
                    <User className="w-4 h-4" />
                    <span className="text-sm font-medium">{user.name}</span>
                  </div>
                  <Button variant="ghost" size="sm" onClick={handleSignOut}>
                    <LogOut className="w-4 h-4" />
                  </Button>
                </div>
              </>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="ghost" size="sm">Log In</Button>
                </Link>
                <Link to="/signup">
                  <Button size="sm">Sign Up</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

function RootContent() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main>
        <Outlet />
      </main>
      <Toaster />
    </div>
  );
}

export function Root() {
  return (
    <AuthProvider>
      <RootContent />
    </AuthProvider>
  );
}
