
"use client"; // Ensure this is a client component

import { useState, useEffect } from 'react'; // Import useState and useEffect
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { SolanaTransaction } from "@/services/solana"; // Assuming this type exists
// import { getTransactionHistory } from "@/services/solana"; // Keep for future use
import { format } from "date-fns";
import { ArrowDownLeft, ArrowUpRight, History as HistoryIcon } from "lucide-react"; // Renamed History to HistoryIcon
import { Skeleton } from "@/components/ui/skeleton"; // Import Skeleton

// Define mock data generation function to be called client-side
const generateMockTransactions = (): SolanaTransaction[] => [
  { id: 'tx1', timestamp: Date.now() - 86400000 * 2, amount: 1.5, type: 'Swap SOL to USDC', tokenIn: 'SOL', tokenOut: 'USDC', rate: 150.25, status: 'Success', explorerUrl: '#', source: 'AutoSwap' },
  { id: 'tx2', timestamp: Date.now() - 86400000 * 1, amount: 500000, type: 'Swap BONK to USDC', tokenIn: 'BONK', tokenOut: 'USDC', rate: 0.0000255, status: 'Success', explorerUrl: '#', source: 'AutoSwap' },
  { id: 'tx3', timestamp: Date.now() - 3600000 * 5, amount: 0.8, type: 'Swap SOL to USDT', tokenIn: 'SOL', tokenOut: 'USDT', rate: 151.1034, status: 'Success', explorerUrl: '#', source: 'Other' }, // Not AutoSwap
  { id: 'tx4', timestamp: Date.now() - 3600000 * 2, amount: 1200, type: 'Swap JUP to USDC', tokenIn: 'JUP', tokenOut: 'USDC', rate: 1.1589, status: 'Success', explorerUrl: '#', source: 'AutoSwap' },
  { id: 'tx5', timestamp: Date.now() - 3600000 * 1, amount: 2.1, type: 'Swap SOL to USDC', tokenIn: 'SOL', tokenOut: 'USDC', rate: 149.5, status: 'Failed', explorerUrl: '#', source: 'AutoSwap' },
  { id: 'tx6', timestamp: Date.now() - 86400000 * 3, amount: 10.0, type: 'Manual Swap USDC to SOL', tokenIn: 'USDC', tokenOut: 'SOL', rate: 0.0066, status: 'Success', explorerUrl: '#', source: 'Other' }, // Not AutoSwap
].sort((a, b) => b.timestamp - a.timestamp); // Ensure sorted by most recent


export function TransactionHistory() {
  const [transactions, setTransactions] = useState<SolanaTransaction[]>([]);
  const [isClient, setIsClient] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // Add loading state

  useEffect(() => {
    // This code runs only on the client after hydration
    setIsClient(true);
    setIsLoading(true); // Start loading

    // Simulate fetching data
    const fetchData = async () => {
       // In a real app, fetch transactions using getTransactionHistory and wallet address
       // const fetchedTransactions = await getTransactionHistory(walletAddress);

       // Using mock data generation client-side for now
       const allTransactions = generateMockTransactions();

       // Filter transactions to only include those from AutoSwap
       const autoSwapTransactions = allTransactions.filter(tx => tx.source === 'AutoSwap');

       setTransactions(autoSwapTransactions);
       setIsLoading(false); // End loading
    };

    fetchData();

  }, []); // Empty dependency array ensures this runs once on mount

  // Function to format date safely on the client
  const formatClientDate = (timestamp: number) => {
    // Date formatting requires client-side execution
    try {
      return format(timestamp, "PPp");
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Invalid Date"; // Fallback for errors
    }
  };

   // Render skeleton or null on server / before hydration or while loading
  if (!isClient || isLoading) {
    return (
       <Card className="bg-card text-card-foreground shadow-lg rounded-lg">
         <CardHeader>
           <CardTitle className="text-xl font-semibold flex items-center gap-2">
             <HistoryIcon className="w-5 h-5" /> Transaction History
           </CardTitle>
           <CardDescription>Recent automatic swap activities performed by this app.</CardDescription>
         </CardHeader>
         <CardContent>
            <Table>
                <TableHeader>
                 <TableRow>
                   <TableHead>Date</TableHead>
                   <TableHead>Type</TableHead>
                   <TableHead>Amount In</TableHead>
                   <TableHead>Amount Out</TableHead>
                   <TableHead className="text-right">Rate</TableHead>
                 </TableRow>
                </TableHeader>
                <TableBody>
                    {[...Array(5)].map((_, index) => (
                      <TableRow key={index}>
                         <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                         <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                         <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                         <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                         <TableCell className="text-right"><Skeleton className="h-4 w-36 ml-auto" /></TableCell>
                      </TableRow>
                    ))}
                </TableBody>
            </Table>
         </CardContent>
       </Card>
    );
  }


  return (
    <Card className="bg-card text-card-foreground shadow-lg rounded-lg">
      <CardHeader>
        <CardTitle className="text-xl font-semibold flex items-center gap-2">
           <HistoryIcon className="w-5 h-5" /> Transaction History
        </CardTitle>
        <CardDescription>Recent automatic swap activities performed by this app.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Amount In</TableHead>
               <TableHead>Amount Out</TableHead>
              <TableHead className="text-right">Rate</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  No automatic swap transactions performed by this app yet.
                </TableCell>
              </TableRow>
            ) : (
              transactions.map((tx) => (
                <TableRow key={tx.id} className={tx.status === 'Failed' ? 'opacity-60' : ''}>
                  <TableCell>{formatClientDate(tx.timestamp)}</TableCell>
                  <TableCell>
                     <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                       <span className="flex items-center gap-1 text-sm font-medium">
                         <ArrowDownLeft className={`h-4 w-4 ${tx.status === 'Failed' ? 'text-muted-foreground' : 'text-red-500'}`} /> {tx.tokenIn}
                       </span>
                       <span className="text-muted-foreground hidden sm:inline">→</span>
                       <span className="flex items-center gap-1 text-sm font-medium">
                         <ArrowUpRight className={`h-4 w-4 ${tx.status === 'Failed' ? 'text-muted-foreground' : 'text-green-500'}`} /> {tx.tokenOut}
                       </span>
                     </div>
                     {tx.status === 'Failed' && <span className="text-xs text-destructive block sm:inline sm:ml-2">(Failed)</span>}
                  </TableCell>
                  <TableCell>
                    {/* Assuming amount is amount of tokenIn */}
                    {tx.amount.toLocaleString()} {tx.tokenIn}
                  </TableCell>
                   <TableCell>
                     {/* Calculate amount out based on rate */}
                     {tx.status !== 'Failed'
                       ? (tx.amount * tx.rate).toLocaleString(undefined, { maximumFractionDigits: 2 })
                       : '-'}{' '}
                     {tx.tokenOut}
                   </TableCell>
                  <TableCell className="text-right">
                     {tx.status !== 'Failed'
                       ? `1 ${tx.tokenIn} = ${tx.rate.toLocaleString(undefined, { maximumFractionDigits: 4 })} ${tx.tokenOut}`
                       : '-'}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

// Ensure the interface properties match the mock data and potential API responses
declare module "@/services/solana" {
  interface SolanaTransaction {
    tokenIn: string;
    tokenOut: string;
    rate: number;
    status?: string; // Added status
    explorerUrl?: string; // Added explorerUrl
    source?: 'AutoSwap' | 'Other'; // Added source
  }
}
