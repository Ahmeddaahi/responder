import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User } from '@supabase/supabase-js';

export interface SubscriptionLimits {
    knowledgeBaseLimit: number;
    productsLimit: number;
    maxCharsPerItem: number;
    plan: 'free' | 'starter' | 'enterprise' | 'custom';
    messagesUsed: number;
    messageLimit: number;
}

export const useSubscriptionLimits = (user: User | null) => {
    const [limits, setLimits] = useState<SubscriptionLimits | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!user) {
            setLimits(null);
            setLoading(false);
            return;
        }

        const fetchLimits = async () => {
            try {
                setLoading(true);
                setError(null);

                const { data, error: fetchError } = await supabase
                    .from('subscriptions')
                    .select('plan, knowledge_base_limit, products_limit, max_chars_per_item, messages_used, message_limit')
                    .eq('user_id', user.id)
                    .maybeSingle();

                if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = no rows returned
                    throw fetchError;
                }

                if (data) {
                    setLimits({
                        knowledgeBaseLimit: data.knowledge_base_limit || 5,
                        productsLimit: data.products_limit || 50,
                        maxCharsPerItem: data.max_chars_per_item || 2000,
                        plan: data.plan,
                        messagesUsed: data.messages_used || 0,
                        messageLimit: data.message_limit || 50,
                    });
                } else {
                    // No subscription - user needs to choose a plan
                    // Return null limits so components can handle it appropriately
                    setLimits(null);
                }
            } catch (err: any) {
                console.error('Error fetching subscription limits:', err);
                setError(err.message);
                // Set default limits on error
                setLimits({
                    knowledgeBaseLimit: 5,
                    productsLimit: 50,
                    maxCharsPerItem: 2000,
                    plan: 'free',
                    messagesUsed: 0,
                    messageLimit: 50,
                });
            } finally {
                setLoading(false);
            }
        };

        fetchLimits();
    }, [user]);

    return { limits, loading, error };
};
