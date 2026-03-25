import { supabase } from '../utils/supabase';
import { AuthPort, MarketPort, EventPort } from '../application/ports';
import { User, MarketItem, Event } from '../domain/entities';

export class SupabaseAdapter implements AuthPort, MarketPort, EventPort {
  async getUser(): Promise<User | null> {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return null;
    
    // Check if user is admin via a custom claim or a profiles table
    // Simplification: We will assume a 'profiles' table holds isAdmin flag
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    return {
      id: user.id,
      email: user.email!,
      isAdmin: profile?.is_admin || false,
    };
  }

  async signIn(email: string, password: string): Promise<User> {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    if (!data.user) throw new Error("No user returned");
    const userResult = await this.getUser();
    if (!userResult) throw new Error("Failed to get profile");
    return userResult;
  }

  async signOut(): Promise<void> {
    await supabase.auth.signOut();
  }

  async getItems(): Promise<MarketItem[]> {
    const { data, error } = await supabase.from('market_items').select('*');
    if (error) throw error;
    // Map DB fields to Domain if necessary
    return data.map(item => ({
      id: item.id,
      name: item.name,
      price: item.price,
      imageUrl: item.image_url,
      description: item.description,
    }));
  }

  async createItem(item: Omit<MarketItem, 'id'>): Promise<MarketItem> {
    const { data, error } = await supabase.from('market_items').insert({
      name: item.name,
      price: item.price,
      image_url: item.imageUrl,
      description: item.description,
    }).select().single();
    if (error) throw error;
    return { id: data.id, name: data.name, price: data.price, imageUrl: data.image_url, description: data.description };
  }

  async updateItem(id: string, item: Partial<MarketItem>): Promise<MarketItem> {
    const payload: any = {};
    if (item.name) payload.name = item.name;
    if (item.price) payload.price = item.price;
    if (item.imageUrl) payload.image_url = item.imageUrl;
    if (item.description) payload.description = item.description;

    const { data, error } = await supabase.from('market_items').update(payload).eq('id', id).select().single();
    if (error) throw error;
    return { id: data.id, name: data.name, price: data.price, imageUrl: data.image_url, description: data.description };
  }

  async deleteItem(id: string): Promise<void> {
    const { error } = await supabase.from('market_items').delete().eq('id', id);
    if (error) throw error;
  }

  async getEvents(): Promise<Event[]> {
    const { data, error } = await supabase.from('events').select('*');
    if (error) throw error;
    return data.map(e => ({
      id: e.id,
      title: e.title,
      date: e.date,
      location: e.location,
      imageUrl: e.image_url,
      description: e.description,
      type: e.type,
    }));
  }

  async createEvent(event: Omit<Event, 'id'>): Promise<Event> {
    const { data, error } = await supabase.from('events').insert({
      title: event.title,
      date: event.date,
      location: event.location,
      image_url: event.imageUrl,
      description: event.description,
      type: event.type,
    }).select().single();
    if (error) throw error;
    return { id: data.id, title: data.title, date: data.date, location: data.location, imageUrl: data.image_url, description: data.description, type: data.type };
  }

  async updateEvent(id: string, event: Partial<Event>): Promise<Event> {
    const payload: any = {};
    if (event.title) payload.title = event.title;
    if (event.date) payload.date = event.date;
    if (event.location) payload.location = event.location;
    if (event.imageUrl) payload.image_url = event.imageUrl;
    if (event.description) payload.description = event.description;
    if (event.type) payload.type = event.type;

    const { data, error } = await supabase.from('events').update(payload).eq('id', id).select().single();
    if (error) throw error;
    // Map back
    return { id: data.id, title: data.title, date: data.date, location: data.location, imageUrl: data.image_url, description: data.description, type: data.type };
  }

  async deleteEvent(id: string): Promise<void> {
    const { error } = await supabase.from('events').delete().eq('id', id);
    if (error) throw error;
  }
}
