import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Clock, Users, Heart } from 'lucide-react';
import { projectId, publicAnonKey } from '/utils/supabase/info';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';

interface Recipe {
  id: string;
  title: string;
  description: string;
  ingredients: string[];
  instructions: string[];
  prepTime?: string;
  cookTime?: string;
  servings?: number;
  category?: string;
  image?: string;
  authorName: string;
  status: string;
  createdAt: string;
}

export function Home() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, accessToken, refreshUser } = useAuth();

  useEffect(() => {
    fetchRecipes();
  }, []);

  const fetchRecipes = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-e298476a/recipes`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setRecipes(data.recipes);
      }
    } catch (error) {
      console.error('Error fetching recipes:', error);
      toast.error('Failed to load recipes');
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = async (recipeId: string) => {
    if (!user || !accessToken) {
      toast.error('Please log in to add favorites');
      return;
    }

    const isFavorite = user.favorites?.includes(recipeId);
    const method = isFavorite ? 'DELETE' : 'POST';

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-e298476a/favorites/${recipeId}`,
        {
          method,
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (response.ok) {
        await refreshUser();
        toast.success(isFavorite ? 'Removed from favorites' : 'Added to favorites');
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast.error('Failed to update favorites');
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <p className="text-gray-500">Loading recipes...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-orange-500 to-red-500 text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold mb-4">Discover Amazing Recipes</h1>
          <p className="text-xl mb-8">Explore delicious recipes shared by our community</p>
          <Link to="/search">
            <Button size="lg" variant="secondary">
              Find Recipes by Ingredients
            </Button>
          </Link>
        </div>
      </section>

      {/* Recipes Grid */}
      <section className="container mx-auto px-4 py-12">
        <h2 className="text-3xl font-bold mb-8">Featured Recipes</h2>
        
        {recipes.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">No recipes available yet.</p>
            {user && (
              <Link to="/submit">
                <Button>Submit the First Recipe</Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recipes.map((recipe) => (
              <Card key={recipe.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                {recipe.image && (
                  <img 
                    src={recipe.image} 
                    alt={recipe.title}
                    className="w-full h-48 object-cover"
                  />
                )}
                
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-xl mb-2">{recipe.title}</CardTitle>
                      <CardDescription>By {recipe.authorName}</CardDescription>
                    </div>
                    {user && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleFavorite(recipe.id)}
                        className="ml-2"
                      >
                        <Heart
                          className={`w-5 h-5 ${
                            user.favorites?.includes(recipe.id)
                              ? 'fill-red-500 text-red-500'
                              : 'text-gray-400'
                          }`}
                        />
                      </Button>
                    )}
                  </div>
                </CardHeader>

                <CardContent>
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {recipe.description}
                  </p>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {recipe.category && (
                      <Badge variant="secondary">{recipe.category}</Badge>
                    )}
                    {recipe.prepTime && (
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <Clock className="w-4 h-4" />
                        <span>{recipe.prepTime}</span>
                      </div>
                    )}
                    {recipe.servings && (
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <Users className="w-4 h-4" />
                        <span>{recipe.servings} servings</span>
                      </div>
                    )}
                  </div>
                </CardContent>

                <CardFooter>
                  <Link to={`/recipe/${recipe.id}`} className="w-full">
                    <Button className="w-full">View Recipe</Button>
                  </Link>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
