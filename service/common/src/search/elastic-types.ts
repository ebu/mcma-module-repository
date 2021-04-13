export type Match = { match?: { [key: string]: any } } | Query;

export type Bool = {
    must?: Match[],
    should?: Match[],
    must_not?: Match[]
};

export type Query = {
    bool: Bool
};

export type SortSpec = {
    order: "asc" | "desc"
};

export type Sort = {
    [key: string]: SortSpec
};

export type Request = {
    size?: number;
    from?: number;
    query?: Query;
    sort?: Sort
};

export type Hit<T> = { _source: T };

export type Results<T> = {
    hits: {
        hits?: Hit<T>[];
        total: {
            value: number;
            relation: "eq" | "gte";
        }
    };
};