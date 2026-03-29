import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { CheckCircle, XCircle, Clock, Users } from 'lucide-react';
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

export function AdminDashboard() {
  const [pendingRecipes, setPendingRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, accessToken } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    if (user.role !== 'admin') {
      toast.error('Admin access required');
      navigate('/');
      return;
    }

    fetchPendingRecipes();
  }, [user]);

  const fetchPendingRecipes = async () => {
    if (!accessToken) return;

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-e298476a/recipes/pending`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setPendingRecipes(data.recipes);
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to load pending recipes');
      }
    } catch (error) {
      console.error('Error fetching pending recipes:', error);
      toast.error('Failed to load pending recipes');
    } finally {
      setLoading(false);
    }
  };

  const approveRecipe = async (recipeId: string) => {
    if (!accessToken) return;

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-e298476a/recipes/${recipeId}/approve`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (response.ok) {
        setPendingRecipes(pendingRecipes.filter(r => r.id !== recipeId));
        toast.success('Recipe approved');
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to approve recipe');
      }
    } catch (error) {
      console.error('Error approving recipe:', error);
      toast.error('Failed to approve recipe');
    }
  };

  const deleteRecipe = async (recipeId: string) => {
    if (!accessToken) return;

    if (!confirm('Are you sure you want to delete this recipe?')) {
      return;
    }

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-e298476a/recipes/${recipeId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (response.ok) {
        setPendingRecipes(pendingRecipes.filter(r => r.id !== recipeId));
        toast.success('Recipe deleted');
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to delete recipe');
      }
    } catch (error) {
      console.error('Error deleting recipe:', error);
      toast.error('Failed to delete recipe');
    }
  };

  if (!user || user.role !== 'admin') {
    return null;
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Admin Dashboard</h1>
        <p className="text-gray-600">Review and manage submitted recipes</p>
      </div>

      <Tabs defaultValue="pending" className="w-full">
        <TabsList>
          <TabsTrigger value="pending">
            Pending Recipes ({pendingRecipes.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-6">
          {pendingRecipes.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <p className="text-gray-500">No pending recipes to review</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {pendingRecipes.map((recipe) => (
                <Card key={recipe.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-2xl mb-2">{recipe.title}</CardTitle>
                        <CardDescription>
                          Submitted by {recipe.authorName} on{' '}
                          {new Date(recipe.createdAt).toLocaleDateString()}
                        </CardDescription>
                      </div>
                      <Badge variant="outline" className="ml-4">
                        <Clock className="w-3 h-3 mr-1" />
                        Pending
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {recipe.image && (
                      <img
                        src={recipe.image}
                        alt={recipe.title}
                        className="w-full h-64 object-cover rounded-md"
                      />
                    )}

                    <div>
                      <h3 className="font-semibold mb-2">Description</h3>
                      <p className="text-gray-700">{recipe.description}</p>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      {recipe.category && (
                        <Badge variant="secondary">{recipe.category}</Badge>
                      )}
                      {recipe.prepTime && (
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <Clock className="w-4 h-4" />
                          <span>Prep: {recipe.prepTime}</span>
                        </div>
                      )}
                      {recipe.cookTime && (
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <Clock className="w-4 h-4" />
                          <span>Cook: {recipe.cookTime}</span>
                        </div>
                      )}
                      {recipe.servings && (
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <Users className="w-4 h-4" />
                          <span>{recipe.servings} servings</span>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h3 className="font-semibold mb-2">Ingredients ({recipe.ingredients.length})</h3>
                        <ul className="space-y-1 text-sm">
                          {recipe.ingredients.map((ingredient, index) => (
                            <li key={index} className="flex items-start gap-2">
                              <span className="text-orange-500">•</span>
                              <span className="text-gray-700">{ingredient}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <h3 className="font-semibold mb-2">Instructions ({recipe.instructions.length})</h3>
                        <ol className="space-y-2 text-sm">
                          {recipe.instructions.map((instruction, index) => (
                            <li key={index} className="flex gap-2">
                              <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-orange-500 text-white rounded-full text-xs">
                                {index + 1}
                              </span>
                              <p className="text-gray-700">{instruction}</p>
                            </li>
                          ))}
                        </ol>
                      </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                      <Button
                        className="flex-1"
                        onClick={() => approveRecipe(recipe.id)}
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Approve Recipe
                      </Button>
                      <Button
                        variant="destructive"
                        className="flex-1"
                        onClick={() => deleteRecipe(recipe.id)}
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Delete Recipe
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
