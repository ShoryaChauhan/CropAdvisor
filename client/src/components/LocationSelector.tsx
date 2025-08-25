import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { MapPin } from "lucide-react";

interface State {
  id: string;
  name: string;
  code: string;
}

interface SoilType {
  id: string;
  stateId: string;
  name: string;
  description: string;
  phRange: string;
  characteristics: string;
}

export default function LocationSelector() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedState, setSelectedState] = useState(user?.selectedState || "");
  const [selectedSoilType, setSelectedSoilType] = useState(user?.selectedSoilType || "");

  // Fetch states
  const { data: states = [], isLoading: isLoadingStates } = useQuery({
    queryKey: ["/api/states"],
    retry: false,
  });

  // Fetch soil types for selected state
  const { data: soilTypes = [], isLoading: isLoadingSoilTypes } = useQuery({
    queryKey: ["/api/soil-types", selectedState],
    enabled: !!selectedState,
    retry: false,
  });

  // Update location mutation
  const updateLocationMutation = useMutation({
    mutationFn: async (data: { selectedState: string; selectedSoilType: string }) => {
      await apiRequest("PATCH", "/api/user/location", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/crop-recommendations"] });
      toast({
        title: "Success",
        description: "Location updated successfully!",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to update location",
        variant: "destructive",
      });
    },
  });

  const handleStateChange = (stateId: string) => {
    setSelectedState(stateId);
    setSelectedSoilType(""); // Reset soil type when state changes
  };

  const handleUpdateLocation = () => {
    if (!selectedState || !selectedSoilType) {
      toast({
        title: "Missing Information",
        description: "Please select both state and soil type",
        variant: "destructive",
      });
      return;
    }

    updateLocationMutation.mutate({
      selectedState,
      selectedSoilType,
    });
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center mb-4">
          <MapPin className="text-farm-green mr-3 h-5 w-5" />
          <h3 className="text-lg font-semibold text-gray-900">Location Settings</h3>
        </div>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="state-select" className="block text-sm font-medium text-gray-700 mb-2">
              Select State
            </Label>
            <Select 
              value={selectedState} 
              onValueChange={handleStateChange}
              disabled={isLoadingStates}
            >
              <SelectTrigger 
                id="state-select"
                className="w-full"
                data-testid="select-state"
              >
                <SelectValue placeholder={isLoadingStates ? "Loading states..." : "Choose your state"} />
              </SelectTrigger>
              <SelectContent>
                {states.map((state: State) => (
                  <SelectItem key={state.id} value={state.id}>
                    {state.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="soil-select" className="block text-sm font-medium text-gray-700 mb-2">
              Soil Type
            </Label>
            <Select 
              value={selectedSoilType} 
              onValueChange={setSelectedSoilType}
              disabled={!selectedState || isLoadingSoilTypes}
            >
              <SelectTrigger 
                id="soil-select"
                className="w-full"
                data-testid="select-soil-type"
              >
                <SelectValue 
                  placeholder={
                    !selectedState 
                      ? "Select state first" 
                      : isLoadingSoilTypes 
                        ? "Loading soil types..." 
                        : "Choose soil type"
                  } 
                />
              </SelectTrigger>
              <SelectContent>
                {soilTypes.map((soilType: SoilType) => (
                  <SelectItem key={soilType.id} value={soilType.id}>
                    {soilType.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <Button 
            onClick={handleUpdateLocation}
            disabled={updateLocationMutation.isPending || !selectedState || !selectedSoilType}
            className="w-full bg-farm-green text-white hover:bg-green-700"
            data-testid="button-update-location"
          >
            {updateLocationMutation.isPending ? "Updating..." : "Update Location"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
