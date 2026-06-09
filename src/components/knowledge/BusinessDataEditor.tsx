import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Download, Upload, Plus, Trash2 } from "lucide-react";
import Papa from "papaparse";

export default function BusinessDataEditor({ userId }: { userId: string }) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [kbEntries, setKbEntries] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // New KB entry state
  const [newKbTitle, setNewKbTitle] = useState("");
  const [newKbContent, setNewKbContent] = useState("");

  useEffect(() => {
    if (userId) {
      fetchProducts(userId);
      fetchKbEntries(userId);
    }
  }, [userId]);

  const fetchProducts = async (uid: string) => {
    const { data, error } = await supabase
      .from("user_products")
      .select("*")
      .eq("user_id", uid)
      .order("created_at", { ascending: false });
    
    if (!error && data) {
      setProducts(data);
    }
  };

  const fetchKbEntries = async (uid: string) => {
    const { data, error } = await supabase
      .from("knowledge_base")
      .select("*")
      .eq("user_id", uid)
      .eq("type", "text")
      .order("created_at", { ascending: false });
    
    if (!error && data) {
      setKbEntries(data);
    }
  };

  const downloadCsvTemplate = () => {
    const csvContent = "Name,Price,Category,Quantity,Details\nSample Product,19.99,Electronics,10,This is a sample product description";
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "products_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userId) return;

    setLoading(true);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const rows = results.data as any[];
          
          const validProducts = rows.map((row) => ({
            user_id: userId,
            name: row.Name || "Unnamed Product",
            price: row.Price ? parseFloat(row.Price) : null,
            category: row.Category || null,
            quantity: row.Quantity ? parseInt(row.Quantity, 10) : null,
            details: row.Details || null,
          }));

          if (validProducts.length === 0) {
            throw new Error("No valid products found in CSV.");
          }

          const { error } = await supabase
            .from("user_products")
            .insert(validProducts);

          if (error) throw error;

          toast({
            title: "Success",
            description: `Imported ${validProducts.length} products successfully.`,
          });
          
          fetchProducts(userId);
        } catch (error: any) {
          toast({
            title: "Import Failed",
            description: error.message || "Failed to import products.",
            variant: "destructive",
          });
        } finally {
          setLoading(false);
          if (fileInputRef.current) fileInputRef.current.value = "";
        }
      },
      error: (error) => {
        setLoading(false);
        toast({
          title: "CSV Parse Error",
          description: error.message,
          variant: "destructive",
        });
      }
    });
  };

  const handleDeleteProduct = async (id: string) => {
    try {
      const { error } = await supabase.from("user_products").delete().eq("id", id);
      if (error) throw error;
      setProducts(products.filter(p => p.id !== id));
      toast({ title: "Product deleted" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleAddKbEntry = async () => {
    if (!userId || !newKbTitle.trim() || !newKbContent.trim()) return;
    
    setLoading(true);
    try {
      const { error, data } = await supabase
        .from("knowledge_base")
        .insert({
          user_id: userId,
          type: "text",
          title: newKbTitle,
          content: newKbContent
        })
        .select()
        .single();
        
      if (error) throw error;
      
      setKbEntries([data, ...kbEntries]);
      setNewKbTitle("");
      setNewKbContent("");
      toast({ title: "Knowledge base entry added" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteKbEntry = async (id: string) => {
    try {
      const { error } = await supabase.from("knowledge_base").delete().eq("id", id);
      if (error) throw error;
      setKbEntries(kbEntries.filter(k => k.id !== id));
      toast({ title: "Entry deleted" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  return (
    <div className="w-full mt-8">
      <div className="mb-6 border-b pb-4">
        <h2 className="text-2xl font-bold mb-2">Business Data</h2>
        <p className="text-muted-foreground">
          Manage your products inventory and general business knowledge.
        </p>
      </div>

      <Tabs defaultValue="products" className="w-full">
            <TabsList className="mb-6 grid w-full grid-cols-2 lg:w-[400px]">
              <TabsTrigger value="products">Products Inventory</TabsTrigger>
              <TabsTrigger value="knowledge">Knowledge Base</TabsTrigger>
            </TabsList>

            <TabsContent value="products">
              <Card className="p-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                  <div>
                    <h2 className="text-xl font-semibold">Bulk Import Products</h2>
                    <p className="text-sm text-muted-foreground">Upload a CSV file to add multiple products at once.</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={downloadCsvTemplate} disabled={loading}>
                      <Download className="w-4 h-4 mr-2" />
                      Template
                    </Button>
                    <div>
                      <input 
                        type="file" 
                        accept=".csv" 
                        className="hidden" 
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                      />
                      <Button onClick={() => fileInputRef.current?.click()} disabled={loading}>
                        <Upload className="w-4 h-4 mr-2" />
                        Import CSV
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead className="w-[80px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {products.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                            No products found. Import a CSV to get started.
                          </TableCell>
                        </TableRow>
                      ) : (
                        products.map((product) => (
                          <TableRow key={product.id}>
                            <TableCell className="font-medium">{product.name}</TableCell>
                            <TableCell>{product.category || "-"}</TableCell>
                            <TableCell>{product.price !== null ? product.price : "-"}</TableCell>
                            <TableCell>{product.quantity !== null ? product.quantity : "-"}</TableCell>
                            <TableCell>
                              <Button variant="ghost" size="sm" onClick={() => handleDeleteProduct(product.id)}>
                                <Trash2 className="w-4 h-4 text-destructive" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="knowledge">
              <div className="grid md:grid-cols-3 gap-6">
                <Card className="p-6 md:col-span-1 h-fit">
                  <h2 className="text-xl font-semibold mb-4">Add Information</h2>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="kb-title">Title</Label>
                      <Input 
                        id="kb-title" 
                        placeholder="e.g. Return Policy" 
                        value={newKbTitle}
                        onChange={e => setNewKbTitle(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="kb-content">Content</Label>
                      <Textarea 
                        id="kb-content" 
                        placeholder="Enter the detailed text here..." 
                        rows={5}
                        value={newKbContent}
                        onChange={e => setNewKbContent(e.target.value)}
                      />
                    </div>
                    <Button className="w-full" onClick={handleAddKbEntry} disabled={loading || !newKbTitle.trim() || !newKbContent.trim()}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add to Knowledge Base
                    </Button>
                  </div>
                </Card>

                <Card className="p-6 md:col-span-2">
                  <h2 className="text-xl font-semibold mb-4">Existing Information</h2>
                  {kbEntries.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground border rounded-md border-dashed">
                      No knowledge base entries yet. Add your business policies, FAQs, or any text the AI should know.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {kbEntries.map((entry) => (
                        <div key={entry.id} className="border rounded-md p-4 relative group">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => handleDeleteKbEntry(entry.id)}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                          <h3 className="font-semibold mb-2 pr-8">{entry.title}</h3>
                          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{entry.content}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              </div>
            </TabsContent>
      </Tabs>
    </div>
  );
}
