import api from './api';

type ApiResponse<T> = {
  success: boolean;
  message: string | null;
  data: T;
};

export type TableStatus = 'empty' | 'occupied' | 'bill_requested';

export type Table = {
  id: string;
  number: string;
  capacity: number;
  status: TableStatus;
  section: string;
  floor: string;
  floorId: string;
  sectionId: string;
  occupiedAt: string | null;
};

export type ApiTable = {
  id: string;
  tableNumber: string;
  capacity: number;
  status: TableStatus;
  sectionId: string;
  occupiedAt: string | null;
};

export type ApiSection = {
  id: string;
  name: string;
  floorId: string;
  tables: ApiTable[];
};

export type ApiFloor = {
  id: string;
  name: string;
  sortOrder: number;
  sections: ApiSection[];
};

export type Floor = {
  id: string;
  name: string;
  sortOrder: number;
  sections: Section[];
};

export type Section = {
  id: string;
  name: string;
  floorId: string;
  tables: Table[];
};

function parseFloors(apiFloors: ApiFloor[]): { floors: Floor[]; tables: Table[] } {
  const allTables: Table[] = [];
  const floors: Floor[] = apiFloors
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map(apiFloor => {
      const sections: Section[] = apiFloor.sections.map(apiSection => {
        const tables: Table[] = apiSection.tables.map(apiTable => ({
          id: apiTable.id,
          number: apiTable.tableNumber,
          capacity: apiTable.capacity,
          status: apiTable.status,
          section: apiSection.name,
          floor: apiFloor.name,
          floorId: apiFloor.id,
          sectionId: apiSection.id,
          occupiedAt: apiTable.occupiedAt,
        }));
        allTables.push(...tables);
        return { id: apiSection.id, name: apiSection.name, floorId: apiFloor.id, tables };
      });
      return { id: apiFloor.id, name: apiFloor.name, sortOrder: apiFloor.sortOrder, sections };
    });
  return { floors, tables: allTables };
}

export const fetchFloors = async (): Promise<Floor[]> => {
  const response = await api.get<ApiResponse<ApiFloor[]>>('/floors');
  const { floors } = parseFloors(response.data.data);
  return floors;
};

export const fetchTables = async (): Promise<Table[]> => {
  const response = await api.get<ApiResponse<ApiFloor[]>>('/floors');
  const { tables } = parseFloors(response.data.data);
  return tables;
};