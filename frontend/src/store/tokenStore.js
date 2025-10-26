import { create } from 'zustand';
import axios from 'axios';

const useTokenStore = create((set, get) => ({
    // State
    tokens: [],
    selectedToken: null,
    loading: false,
    error: null,

    // Setters
    setLoading: (loading) => set({ loading }),
    setError: (error) => set({ error }),
    setTokens: (tokens) => set({ tokens }),
    setSelectedToken: (token) => set({ selectedToken: token }),

    // Token Management with API integration
    fetchTokens: async (walletAddress) => {
        try {
            set({ loading: true, error: null });
            console.log('Fetching tokens for wallet:', walletAddress);
            
            const response = await axios.get(`/api/tokens/user/${walletAddress}`);
            console.log('Fetched tokens:', response.data);
            
            if (response.data.success) {
                set({ tokens: response.data.tokens || [] });
            } else {
                throw new Error(response.data.error || 'Failed to fetch tokens');
            }
        } catch (error) {
            console.error('Error fetching tokens:', error);
            set({ error: error.message });
        } finally {
            set({ loading: false });
        }
    },

    addToken: async (token) => {
        try {
            set({ loading: true, error: null });
            console.log('Adding token:', token);
            
            // First update local state
            set((state) => ({ tokens: [...state.tokens, token] }));
            
            // Then ensure it's saved to backend
            await axios.post('/api/tokens/save', token);
            
            console.log('Token added successfully');
        } catch (error) {
            console.error('Error adding token:', error);
            // Revert local state if backend save fails
            set((state) => ({
                tokens: state.tokens.filter(t => t.tokenMintAddress !== token.tokenMintAddress),
                error: error.message
            }));
        } finally {
            set({ loading: false });
        }
    },

    updateToken: async (tokenMintAddress, updates) => {
        try {
            set({ loading: true, error: null });
            
            // First update local state
            set((state) => ({
                tokens: state.tokens.map(token => 
                    token.tokenMintAddress === tokenMintAddress 
                        ? { ...token, ...updates } 
                        : token
                )
            }));
            
            // Then update in backend
            await axios.put(`/api/tokens/${tokenMintAddress}`, updates);
            
        } catch (error) {
            console.error('Error updating token:', error);
            set({ error: error.message });
        } finally {
            set({ loading: false });
        }
    },

    removeToken: async (tokenMintAddress) => {
        try {
            set({ loading: true, error: null });
            
            // First update local state
            set((state) => ({
                tokens: state.tokens.filter(token => token.tokenMintAddress !== tokenMintAddress)
            }));
            
            // Then remove from backend
            await axios.delete(`/api/tokens/${tokenMintAddress}`);
            
        } catch (error) {
            console.error('Error removing token:', error);
            set({ error: error.message });
        } finally {
            set({ loading: false });
        }
    },

    // Helper methods
    getTokenByMintAddress: (tokenMintAddress) => {
        const state = get();
        return state.tokens.find(token => token.tokenMintAddress === tokenMintAddress);
    },

    // Clear store
    clearStore: () => set({ 
        tokens: [], 
        selectedToken: null, 
        loading: false, 
        error: null 
    })
}));

export default useTokenStore; 