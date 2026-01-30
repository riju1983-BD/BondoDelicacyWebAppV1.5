import React, { useState, useRef, useEffect } from "react";
import * as pdfjsLib from "pdfjs-dist";
import { Icon } from "./Icon";
import { parseMenuFromText } from "../services/geminiService";
import { supabase } from "../services/supabaseClient";

// @ts-ignore
pdfjsLib.GlobalWorkerOptions.workerSrc =
  "https://esm.sh/pdfjs-dist@4.4.168/build/pdf.worker.mjs";

const Spinner: React.FC<{ className?: string }> = ({
  className = "h-5 w-5",
}) => (
  <svg
    className={`animate-spin ${className}`}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    />
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    />
  </svg>
);

type RestaurantOption = {
  rest_id: string;
  name: string;
};

const MenuAdminPage: React.FC = () => {
  const [restaurants, setRestaurants] = useState<RestaurantOption[]>([]);
  const [selectedRestId, setSelectedRestId] = useState<string>("");

  const [isParsing, setIsParsing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parsedMenu, setParsedMenu] = useState<any[] | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // -------------------------
  // Load restaurants
  // -------------------------
  useEffect(() => {
    const loadRestaurants = async () => {
      const { data, error } = await supabase
        .from("restaurants")
        .select("rest_id, name")
        .order("name", { ascending: true });

      if (error) {
        console.error(error);
        setError("Failed to load restaurants");
        return;
      }

      const list = (data || []).filter((r) => r.rest_id);
      setRestaurants(list);

      if (!selectedRestId && list.length > 0) {
        setSelectedRestId(list[0].rest_id);
      }
    };

    loadRestaurants();
  }, [selectedRestId]);

  // -------------------------
  // PDF upload + parse
  // -------------------------
  const handleFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setParsedMenu(null);
    setSuccessMessage(null);
    setIsParsing(true);

    try {
      if (file.type !== "application/pdf") {
        throw new Error("Please upload a PDF file.");
      }

      const arrayBuffer = await file.arrayBuffer();
      let text = "";

      const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        // @ts-ignore
        text += content.items.map((item) => item.str).join(" ");
      }

      const result = await parseMenuFromText(text);

      const menuWithImages = result.map((category: any) => ({
        ...category,
        items: category.items.map((item: any) => ({
          ...item,
          image:
            item.image ||
            "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500",
        })),
      }));

      setParsedMenu(menuWithImages);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to parse PDF"
      );
    } finally {
      setIsParsing(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // -------------------------
  // Save menu
  // -------------------------
  const handleSaveMenu = () => {
    if (!parsedMenu || !selectedRestId) {
      setError("Select a restaurant and parse a menu first.");
      return;
    }

    try {
      localStorage.setItem(
        `petpooja-menu-${selectedRestId}`,
        JSON.stringify(parsedMenu)
      );

      const restName =
        restaurants.find((r) => r.rest_id === selectedRestId)?.name ||
        selectedRestId;

      setSuccessMessage(`Menu saved for ${restName}`);
    } catch (e) {
      console.error(e);
      setError("Failed to save menu to local storage.");
    }
  };

  const handleNavigate = (route: string) => {
    window.location.hash = route;
  };

  // -------------------------
  // UI
  // -------------------------
  return (
    <div className="min-h-screen bg-gray-800 text-white p-4 sm:p-6 lg:p-8 flex items-center justify-center">
      <div className="w-full max-w-2xl bg-gray-900 rounded-lg shadow-2xl p-8">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-serif">Menu Management</h1>
          <p className="text-gray-400 mt-2">
            Upload a PDF to parse and save a restaurant menu
          </p>
        </header>

        <div className="space-y-6">
          {error && (
            <div className="p-3 bg-red-900/50 border border-red-600 text-red-200 rounded-md">
              {error}
            </div>
          )}

          {successMessage && (
            <div className="p-3 bg-green-900/50 border border-green-600 text-green-200 rounded-md">
              {successMessage}
            </div>
          )}

          {/* Restaurant select */}
          <div>
            <label className="block text-sm text-gray-300 mb-1">
              Select Restaurant
            </label>
            <select
              value={selectedRestId}
              onChange={(e) => setSelectedRestId(e.target.value)}
              className="block w-full rounded-md border-gray-600 bg-gray-800 py-2 px-3 text-white focus:ring-2 focus:ring-cyan-500"
            >
              {restaurants.map((r) => (
                <option key={r.rest_id} value={r.rest_id}>
                  {r.name} ({r.rest_id})
                </option>
              ))}
            </select>
          </div>

          {/* Upload */}
          <div className="text-center p-6 border-2 border-dashed border-gray-600 rounded-lg">
            <Icon
              type="upload-cloud"
              className="mx-auto h-12 w-12 text-gray-500"
            />

            <label className="mt-2 block text-sm text-cyan-400 cursor-pointer hover:underline">
              Upload a PDF menu
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                className="sr-only"
                disabled={isParsing}
                onChange={handleFileChange}
              />
            </label>

            {isParsing && (
              <div className="flex justify-center gap-2 mt-4 text-sm text-gray-400">
                <Spinner className="w-4 h-4" />
                Parsing menu…
              </div>
            )}
          </div>

          {/* Preview */}
          {parsedMenu && (
            <div>
              <h3 className="text-lg font-semibold mb-2">
                Parsed Menu Preview
              </h3>
              <pre className="bg-gray-800 p-4 rounded-md text-sm max-h-60 overflow-auto border border-gray-700">
                {JSON.stringify(parsedMenu, null, 2)}
              </pre>

              <button
                onClick={handleSaveMenu}
                className="mt-4 w-full bg-cyan-600 hover:bg-cyan-500 text-white py-2 rounded-md font-semibold"
              >
                Save Menu
              </button>
            </div>
          )}
        </div>

        <div className="text-center mt-8">
          <button
            onClick={() => handleNavigate("#")}
            className="text-sm text-cyan-400 hover:underline"
          >
            ← Back to Main Site
          </button>
        </div>
      </div>
    </div>
  );
};

export default MenuAdminPage;
