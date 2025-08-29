import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Users, Award, Heart, MessageSquare, Loader2 } from 'lucide-react';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'react-hot-toast';
import { supabase } from '@/lib/customSupabaseClient';

const CommunityTab = () => {
    const { user } = useAuth();
    const { ranking = [], communityPosts = [], loadingCommunity, refetchCommunityData } = useData();
    const [newPost, setNewPost] = useState('');
    const [isPosting, setIsPosting] = useState(false);
    
    const handlePostSubmit = async () => {
        if (!newPost.trim()) {
            toast.error("Sua publicação não pode estar vazia.");
            return;
        }
        setIsPosting(true);
        try {
            const { error } = await supabase
                .from('community_posts')
                .insert({ user_id: user.id, content: newPost, likes: 0 });
            
            if (error) throw error;
            
            toast.success("Publicação enviada!");
            setNewPost('');
            refetchCommunityData();
        } catch (error) {
            toast.error("Falha ao enviar a publicação.");
            console.error(error);
        } finally {
            setIsPosting(false);
        }
    };

    const handleLikeToggle = async (post) => {
        try {
            if (post.user_has_liked) {
                // Unlike
                const { error } = await supabase
                    .from('post_likes')
                    .delete()
                    .match({ post_id: post.id, user_id: user.id });
                if (error) throw error;
            } else {
                // Like
                const { error } = await supabase
                    .from('post_likes')
                    .insert({ post_id: post.id, user_id: user.id });
                if (error) throw error;
            }
            refetchCommunityData();
        } catch (error) {
            toast.error("Ocorreu um erro ao interagir com a publicação.");
        }
    };
    
    if (loadingCommunity) {
        return (
            <TabsContent value="community" className="mt-6 flex justify-center items-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </TabsContent>
        );
    }
    
    return (
        <TabsContent value="community" className="space-y-6 mt-6">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid md:grid-cols-3 gap-6"
            >
                <div className="md:col-span-2 vida-smart-card p-6 rounded-2xl shadow-lg">
                    <h3 className="text-xl font-semibold mb-4 flex items-center"><Users className="w-6 h-6 mr-2 text-blue-500" /> Comunidade</h3>
                    <div className="mb-4">
                        <Textarea 
                            value={newPost}
                            onChange={(e) => setNewPost(e.target.value)}
                            className="w-full p-2 border rounded-md bg-gray-50" 
                            placeholder="Compartilhe seu progresso e ganhe pontos!"
                            disabled={isPosting}
                        />
                        <div className="flex justify-end items-center mt-2">
                            <Button onClick={handlePostSubmit} disabled={isPosting || !newPost.trim()} className="vida-smart-gradient text-white">
                                {isPosting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                Publicar
                            </Button>
                        </div>
                    </div>
                    {communityPosts.length === 0 ? <p className="text-center text-gray-500 py-8">Ainda não há publicações. Seja o primeiro a compartilhar!</p> : (
                    <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                        {communityPosts.map(post => (
                             <div key={post.id} className="p-4 bg-gray-50 rounded-lg">
                                 <div className="flex items-center space-x-3 mb-2">
                                     <span className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center font-bold text-gray-600">
                                         {post.profile?.full_name?.charAt(0) || '?'}
                                     </span>
                                     <p className="font-semibold">{post.profile?.full_name || 'Usuário Anônimo'}</p>
                                     <p className="text-xs text-gray-500">{new Date(post.created_at).toLocaleDateString()}</p>
                                 </div>
                                 <p className="text-sm text-gray-700 mb-2 whitespace-pre-wrap">{post.content}</p>
                                 <div className="flex items-center space-x-4">
                                     <Button variant="ghost" size="sm" onClick={() => handleLikeToggle(post)}>
                                        <Heart className={`w-4 h-4 mr-1 ${post.user_has_liked ? 'text-red-500 fill-current' : 'text-gray-500'}`}/> 
                                        {post.likes}
                                    </Button>
                                     <Button variant="ghost" size="sm"><MessageSquare className="w-4 h-4 mr-1"/> Comentar</Button>
                                 </div>
                             </div>
                        ))}
                    </div>
                    )}
                </div>

                <div className="vida-smart-card p-6 rounded-2xl shadow-lg">
                    <h3 className="text-xl font-semibold mb-4 flex items-center"><Award className="w-6 h-6 mr-2 text-yellow-500" /> Ranking Semanal</h3>
                     <div className="space-y-3">
                        {ranking.map((player, index) => (
                             <div key={player.id} className={`flex items-center space-x-3 p-2 rounded-lg ${player.id === user.id ? 'bg-green-100' : ''}`}>
                                 <span className="font-bold w-6">{index + 1}.</span>
                                 <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${
                                     index === 0 ? 'bg-yellow-400' : index === 1 ? 'bg-gray-400' : index === 2 ? 'bg-orange-400' : 'bg-gray-300'}`
                                 }>{player.full_name?.charAt(0) || '?'}</span>
                                 <p className="flex-1 font-medium">{player.full_name}</p>
                                 <p className="font-bold text-yellow-600">{player.points} pts</p>
                             </div>
                        ))}
                    </div>
                </div>
            </motion.div>
        </TabsContent>
    );
};

export default CommunityTab;