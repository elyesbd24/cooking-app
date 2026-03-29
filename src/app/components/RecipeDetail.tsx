import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Clock, Users, Heart, ArrowLeft } from 'lucide-react';
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

export function RecipeDetail() {
  const { id } = useParams<{ id: string }>();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const { user, accessToken, refreshUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (id) {
      fetchRecipe();
    }
  }, [id]);

  const fetchRecipe = async () => {
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
        const foundRecipe = data.recipes.find((r: Recipe) => r.id === id);
        
        if (foundRecipe) {
          setRecipe(foundRecipe);
        } else {
          toast.error('Recipe not found');
        }
      }
    } catch (error) {
      console.error('Error fetching recipe:', error);
      toast.error('Failed to load recipe');
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = async () => {
    if (!user || !accessToken || !recipe) {
      toast.error('Please log in to add favorites');
      return;
    }

    const isFavorite = user.favorites?.includes(recipe.id);
    const method = isFavorite ? 'DELETE' : 'POST';

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-e298476a/favorites/${recipe.id}`,
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
        <p className="text-gray-500">Loading recipe...</p>
      </div>
    );
  }

  if (!recipe) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <p className="text-gray-500 mb-4">Recipe not found</p>
        <Button onClick={() => navigate('/')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <Button variant="ghost" className="mb-6" onClick={() => navigate('/')}>
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Recipes
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {recipe.image && (
            <img
              src={recipe.image}
              alt={recipe.title}
              className="w-full h-96 object-cover rounded-lg shadow-md"
            />
          )}

          <div>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-4xl font-bold mb-2">{recipe.title}</h1>
                <p className="text-gray-600">By {recipe.authorName}</p>
              </div>
              {user && (
                <Button variant="outline" size="lg" onClick={toggleFavorite}>
                  <Heart
                    className={`w-5 h-5 mr-2 ${
                      user.favorites?.includes(recipe.id)
                        ? 'fill-red-500 text-red-500'
                        : 'text-gray-400'
                    }`}
                  />
                  {user.favorites?.includes(recipe.id) ? 'Saved' : 'Save'}
                </Button>
              )}
            </div>

            <div className="flex flex-wrap gap-3 mb-6">
              {recipe.category && (
                <Badge variant="secondary" className="text-sm">
                  {recipe.category}
                </Badge>
              )}
              {recipe.prepTime && (
                <div className="flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-md">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm">Prep: {recipe.prepTime}</span>
                </div>
              )}
              {recipe.cookTime && (
                <div className="flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-md">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm">Cook: {recipe.cookTime}</span>
                </div>
              )}
              {recipe.servings && (
                <div className="flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-md">
                  <Users className="w-4 h-4" />
                  <span className="text-sm">{recipe.servings} servings</span>
                </div>
              )}
            </div>

            <p className="text-gray-700 text-lg leading-relaxed">
              {recipe.description}
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Instructions</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="space-y-4">
                {recipe.instructions.map((instruction, index) => (
                  <li key={index} className="flex gap-4">
                    <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-orange-500 text-white rounded-full font-semibold">
                      {index + 1}
                    </span>
                    <p className="pt-1 text-gray-700">{instruction}</p>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div>
          <Card className="sticky top-24">
            <CardHeader>
              <CardTitle>Ingredients</CardTitle>
              <CardDescription>
                {recipe.servings && `For ${recipe.servings} servings`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {recipe.ingredients.map((ingredient, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-orange-500 mt-1.5">•</span>
                    <span className="text-gray-700">{ingredient}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
