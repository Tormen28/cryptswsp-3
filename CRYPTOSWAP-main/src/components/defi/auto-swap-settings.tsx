import { useWallet } from '@solana/wallet-adapter-react';
import { useToast } from '@/hooks/use-toast';
import { useAutoSwap } from '@/hooks/use-auto-swap';
import { useState, useEffect } from 'react'; // Added useEffect
import { PublicKey } from '@solana/web3.js'; // Added for mint validation
import { PlusCircle, Trash2, Power, PowerOff } from 'lucide-react';

interface TokenConfig {
  symbol: string;
  mint: string;
  targetStablecoin: string;
  slippage: number;
  enabled: boolean;
  minAmount: number;
  maxAmount: number;
}

export function AutoSwapSettings() {
  const { publicKey } = useWallet();
  const { toast } = useToast();
  const { config, loading, saveConfig, startAutoSwap } = useAutoSwap();

  const [tokensDraft, setTokensDraft] = useState<TokenConfig[]>([]);
  const [newToken, setNewToken] = useState<Omit<TokenConfig, 'enabled' | 'minAmount' | 'maxAmount'>>({
    symbol: '',
    mint: '',
    targetStablecoin: 'USDC',
    slippage: 1,
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [isDirty, setIsDirty] = useState(false);

  // Effect to load existing config into draft
  useEffect(() => {
    if (!loading && config && !isDirty) {
      // Ensure tokens from config are correctly mapped to TokenConfig structure if necessary
      setTokensDraft(config.tokens.map(token => ({ ...token } as TokenConfig)));
    }
  }, [config, loading, isDirty]);

  // Function to check for duplicate symbol or mint (case-insensitive)
  const isDuplicate = (symbol: string, mint: string) =>
    tokensDraft.some(token =>
      token.symbol.toLowerCase() === symbol.toLowerCase() ||
      token.mint.toLowerCase() === mint.toLowerCase()
    );

  // Function to validate slippage value
  const isSlippageValid = (slippage: number) => slippage >= 0.1 && slippage <= 5;

  // Function to validate all tokens in the draft before saving
  const validateBeforeSave = (): string | null => {
    const symbols = new Set<string>();
    const mints = new Set<string>();

    if (tokensDraft.length === 0 && isDirty) {
        // If user cleared all tokens and tries to save, allow it to save an empty list.
        // If there was no change (isDirty is false), "No Changes" toast will appear.
        // If you want to prevent saving an empty list, uncomment below:
        // return "Cannot save an empty list of rules. Add at least one rule or revert changes.";
    }

    for (const token of tokensDraft) {
      if (!token.symbol.trim() || !token.mint.trim()) {
        return 'All listed tokens must have a symbol and mint address.';
      }
      try {
        new PublicKey(token.mint); // Basic format validation for mint address
      } catch (e) {
        return `Invalid mint address format for token ${token.symbol}: ${token.mint}`;
      }

      const lowerSymbol = token.symbol.toLowerCase();
      if (symbols.has(lowerSymbol)) {
        return `Duplicate symbol found: ${token.symbol}`;
      }
      symbols.add(lowerSymbol);

      const lowerMint = token.mint.toLowerCase();
      if (mints.has(lowerMint)) {
        return `Duplicate mint address found: ${token.mint}`;
      }
      mints.add(lowerMint);

      if (!isSlippageValid(token.slippage)) {
        return `Invalid slippage for ${token.symbol}. Must be between 0.1 and 5.`;
      }
    }
    return null; // No errors
  };


  // Add a new token to the draft list
  const handleAddToken = () => {
    setError('');
    const currentSymbol = newToken.symbol.trim();
    const currentMint = newToken.mint.trim();

    if (!currentSymbol || !currentMint) {
      const msg = 'Please complete both symbol and mint address to add the token.';
      setError(msg);
      toast({ title: "Error Adding Token", description: msg, variant: "destructive" });
      return;
    }

    try {
        new PublicKey(currentMint); // Basic client-side validation for mint address format
    } catch (e) {
        const msg = 'The format of the mint address is invalid.';
        setError(msg);
        toast({ title: "Invalid Mint Format", description: msg, variant: "destructive" });
        return;
    }

    if (isDuplicate(currentSymbol, currentMint)) {
      const msg = 'This token is already in the list (duplicate symbol or mint address).';
      setError(msg);
      toast({ title: "Error Adding Token", description: msg, variant: "destructive" });
      return;
    }

    if (!isSlippageValid(Number(newToken.slippage))) {
        const msg = `Slippage for ${currentSymbol} must be between 0.1 and 5.`;
        setError(msg); // Also set the main error state
        toast({ title: "Invalid Slippage", description: msg, variant: "destructive" });
        return;
    }

    setIsDirty(true);
    const tokenToAdd: TokenConfig = {
      symbol: currentSymbol.toUpperCase(),
      mint: currentMint,
      enabled: true,
      targetStablecoin: newToken.targetStablecoin,
      slippage: Number(newToken.slippage),
      minAmount: 0,
      maxAmount: 0,
    };

    setTokensDraft([...tokensDraft, tokenToAdd]);
    setNewToken({ symbol: '', mint: '', targetStablecoin: 'USDC', slippage: 1 });
    toast({ title: "Token Added to Draft", description: `${tokenToAdd.symbol} has been added. Save changes to apply.` });
  };

  // Toggle the 'enabled' status of a token
  const handleToggleToken = (index: number) => {
    setIsDirty(true);
    const updatedTokens = tokensDraft.map((token, i) =>
      i === index ? { ...token, enabled: !token.enabled } : token
    );
    setTokensDraft(updatedTokens);
    const tokenBeingToggled = updatedTokens[index];
    toast({
      title: "Token Status Changed",
      description: `${tokenBeingToggled.symbol} will be ${tokenBeingToggled.enabled ? 'enabled' : 'disabled'} after saving.`,
    });
  };

  // Remove a token from the draft list
  const handleRemoveToken = (indexToRemove: number) => {
    setIsDirty(true);
    const removedTokenSymbol = tokensDraft[indexToRemove].symbol;
    setTokensDraft(prevTokens => prevTokens.filter((_, index) => index !== indexToRemove));
    toast({
      title: "Rule Removed from Draft",
      description: `${removedTokenSymbol} was removed. Save changes to apply.`,
      variant: "default" // Using default as it's not a destructive action until saved
    });
  };

  // Save all changes to the configuration
  const handleSaveAll = async () => {
    setError('');

    // Validate before attempting to save, even if isDirty is false, to catch issues if user clears all then saves.
    const validationError = validateBeforeSave();
    if (validationError) {
      setError(validationError);
      toast({ title: "Validation Error", description: validationError, variant: "destructive" });
      return;
    }

    if (!isDirty) {
      toast({ title: "No Changes", description: "There are no unsaved changes to save." });
      return;
    }

    setSaving(true);
    try {
      if (!publicKey) {
        toast({
          title: "Wallet Not Connected",
          description: "Please connect your wallet to save changes.",
          variant: "destructive"
        });
        setSaving(false); // Stop saving process
        return;
      }
      if (!config && tokensDraft.length > 0) { // config might be null if it was never loaded or error
          // If config is null but we are trying to save tokens, it implies a fresh setup or an issue.
          // We need to ensure autoSwapEnabled and limits have some defaults if config is not there.
          console.warn("Config not loaded, saving with default global settings.");
      }


      const newConfigData = {
        tokens: tokensDraft,
        autoSwapEnabled: config?.autoSwapEnabled ?? false,
        limits: config?.limits ?? { daily: 0, monthly: 0 }
      };

      await saveConfig(publicKey.toString(), newConfigData);

      setIsDirty(false);
      toast({ title: "Success", description: "Configuration saved successfully." });
      startAutoSwap();
    } catch (e: any) {
      console.error("Error saving configuration:", e);
      const errorMessage = e.message || "Unknown error occurred while saving.";
      setError(errorMessage); // Display this error prominently
      toast({ title: "Error Saving", description: errorMessage, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  // Conditional rendering: Wallet not connected
  if (!publicKey) {
    return (
      <div className="text-center p-8 bg-[#1a1b23] rounded-xl shadow-2xl text-gray-300 max-w-md mx-auto">
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-4 text-purple-500"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"></path><path d="M3 5V3a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4"></path><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5"></path><path d="m5 17 1.3-1.3a1.5 1.5 0 0 1 2 0L10 17"></path><circle cx="7.5" cy="10.5" r=".5" fill="currentColor"></circle></svg>
        <p className="text-xl font-semibold mb-2">Connect Your Wallet</p>
        <p className="text-gray-400">Please connect your Solana wallet to manage AutoSwap settings.</p>
      </div>
    );
  }

  // Conditional rendering: Loading configuration
  if (loading) { // !config check is implicitly handled by useEffect dependency, but good for initial load
    return (
      <div className="text-center p-8 bg-[#1a1b23] rounded-xl shadow-2xl text-gray-300 max-w-md mx-auto">
         <svg className="animate-spin h-12 w-12 text-purple-500 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p className="text-xl font-semibold text-gray-300">Loading AutoSwap Configuration...</p>
        <p className="text-gray-400">Please wait a moment.</p>
      </div>
    );
  }

  // Main component render
  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 lg:p-8 font-sans">
      <div className="bg-[#1a1b23] p-6 rounded-xl shadow-2xl text-gray-200">
        {/* Encabezado y contenido principal */}
        <div className="flex items-center gap-3 mb-4">
          <svg className="w-6 h-6 text-purple-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          </svg>
          <h1 className="text-2xl font-bold">Automatic Swap Settings</h1>
        </div>
        <p className="text-gray-400 mb-8">Configure tokens to automatically swap to stablecoins. Changes require saving.</p>


        {/* Add New Rule Panel */}
        <div className="bg-[#0d0e12] rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-5 text-gray-100">Add New Swap Rule</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="tokenSymbol" className="block text-sm text-gray-400 mb-1.5">From Token (Symbol)</label>
              <input
                id="tokenSymbol"
                className="w-full bg-[#1a1b23] border border-gray-700 rounded-lg p-2.5 text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                placeholder="e.g., MYTOKEN"
                value={newToken.symbol}
                onChange={e => setNewToken({ ...newToken, symbol: e.target.value })}
              />
            </div>
            <div>
              <label htmlFor="targetStablecoin" className="block text-sm text-gray-400 mb-1.5">To Stablecoin</label>
              <select
                id="targetStablecoin"
                className="w-full bg-[#1a1b23] border border-gray-700 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                value={newToken.targetStablecoin}
                onChange={e => setNewToken({ ...newToken, targetStablecoin: e.target.value })}
              >
                <option value="USDC">USDC</option>
                <option value="USDT">USDT</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label htmlFor="tokenMint" className="block text-sm text-gray-400 mb-1.5">Token Contract (Mint Address)</label>
              <input
                id="tokenMint"
                className="w-full bg-[#1a1b23] border border-gray-700 rounded-lg p-2.5 text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                placeholder="Enter valid Solana mint address"
                value={newToken.mint}
                onChange={e => setNewToken({ ...newToken, mint: e.target.value })}
              />
            </div>
            <div>
              <label htmlFor="maxSlippage" className="block text-sm text-gray-400 mb-1.5">Max Slippage (%)</label>
              <input
                id="maxSlippage"
                type="number"
                className="w-full bg-[#1a1b23] border border-gray-700 rounded-lg p-2.5 text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                min={0.1}
                max={5}
                step={0.1}
                value={newToken.slippage}
                onChange={e => setNewToken({ ...newToken, slippage: Number(e.target.value) })}
              />
            </div>
            <div className="md:col-span-2">
              <button
                className="w-full bg-purple-600 hover:bg-purple-700 text-white rounded-lg py-2.5 px-4 flex items-center justify-center gap-2 mt-3 transition-colors duration-150"
                onClick={handleAddToken}
              >
                <PlusCircle size={20} />
                Add Rule to Draft
              </button>
            </div>
          </div>
        </div>

        {/* Display Error Messages from Form Validation or Save Operation */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
            <p className="font-medium">Error:</p>
            <p>{error}</p>
          </div>
        )}

        {/* List of Draft Tokens */}
        {tokensDraft.length > 0 && (
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-100">Current Swap Rules ({tokensDraft.length})</h2>
            <div className="space-y-3">
              {tokensDraft.map((token, index) => (
                <div key={`${token.mint}-${index}`} className="bg-[#0d0e12] rounded-lg p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex-grow">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${token.enabled ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>
                        {token.enabled ? 'Enabled' : 'Disabled'}
                      </span>
                      <span className="font-semibold text-lg text-gray-100">{token.symbol}</span>
                    </div>
                    <div className="text-sm text-gray-400 mt-1">
                      Mint: <span className="font-mono text-xs break-all">{token.mint}</span>
                    </div>
                    <div className="text-sm text-gray-400">
                      Swaps to: {token.targetStablecoin} | Slippage: {token.slippage}%
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-2 sm:mt-0 flex-shrink-0">
                    <button
                      title={token.enabled ? "Disable Rule" : "Enable Rule"}
                      className={`p-2 rounded-md transition-colors duration-150 ${token.enabled ? 'bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400' : 'bg-green-500/20 hover:bg-green-500/30 text-green-400'}`}
                      onClick={() => handleToggleToken(index)}
                    >
                      {token.enabled ? <PowerOff size={18} /> : <Power size={18} />}
                    </button>
                    <button
                        title="Remove Rule"
                        className="p-2 rounded-md bg-red-500/20 hover:bg-red-500/30 text-red-400 transition-colors duration-150"
                        onClick={() => handleRemoveToken(index)}
                    >
                        <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Save All Button */}
        {(tokensDraft.length > 0 || isDirty) && ( // Show save button if there are tokens OR if it's dirty (e.g. all tokens removed)
          <div className="mt-8 pt-6 border-t border-gray-700">
            <button
              className={`w-full py-3 px-4 rounded-lg text-white font-semibold flex items-center justify-center gap-2 transition-all duration-150
                          ${isDirty ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-600 cursor-not-allowed'}
                          ${saving ? 'opacity-70 cursor-wait' : ''}`}
              onClick={handleSaveAll}
              disabled={saving || !isDirty}
            >
              {saving ? (
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
              )}
              {saving ? 'Saving Changes...' : (isDirty ? 'Save All Changes' : 'No Unsaved Changes')}
            </button>
            {!isDirty && tokensDraft.length > 0 && (
              <p className="text-xs text-gray-400 mt-2 text-center">Modify existing rules, add new ones, or remove rules to enable saving.</p>
            )}
          </div>
        )}

        {/* Empty state for when there are no tokens and no errors */}
        {tokensDraft.length === 0 && !error && !loading && ( // Ensure not loading
          <div className="text-center py-10 px-6 bg-[#0d0e12] rounded-lg">
            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-3 text-gray-500"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path><circle cx="12" cy="10" r="3"></circle></svg>
            <p className="text-gray-400 font-medium">No auto-swap rules configured yet.</p>
            <p className="text-sm text-gray-500">Use the form above to add your first token swap rule.</p>
          </div>
        )}

      </div>
    </div>
  );
}

export default AutoSwapSettings;