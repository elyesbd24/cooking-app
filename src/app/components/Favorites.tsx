import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Clock, Users, Heart } from 'lucide-react';
import { projectId } from '/utils/supabase/info';
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

export function Favorites() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, accessToken, refreshUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user || !accessToken) {
      navigate('/login');
      return;
    }
    fetchFavorites();
  }, [user, accessToken]);

  const fetchFavorites = async () => {
    if (!accessToken) return;

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-e298476a/favorites`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setRecipes(data.recipes);
      }
    } catch (error) {
      console.error('Error fetching favorites:', error);
      toast.error('Failed to load favorites');
    } finally {
      setLoading(false);
    }
  };

  const removeFavorite = async (recipeId: string) => {
    if (!accessToken) return;

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-e298476a/favorites/${recipeId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (response.ok) {
        await refreshUser();
        setRecipes(recipes.filter(r => r.id !== recipeId));
        toast.success('Removed from favorites');
      }
    } catch (error) {
      console.error('Error removing favorite:', error);
      toast.error('Failed to remove from favorites');
    }
  };

  if (!user) {
    return null;
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <p className="text-gray-500">Loading favorites...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">My Favorites</h1>
        <p className="text-gray-600">Your saved recipes</p>
      </div>

      {recipes.length === 0 ? (
        <div className="text-center py-12">
          <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">You haven't saved any recipes yet.</p>
          <Link to="/">
            <Button>Browse Recipes</Button>
          </Link>
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
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFavorite(recipe.id)}
                    className="ml-2"
                  >
                    <Heart className="w-5 h-5 fill-red-500 text-red-500" />
                  </Button>
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
    </div>
  );
}
