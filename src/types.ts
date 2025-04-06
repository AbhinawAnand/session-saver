export interface TabInfo {
    title: string;
    url: string;
  }
  
  export interface Session {
    id: string;
    name: string;
    createdAt: string;
    tabs: TabInfo[];
  }
  