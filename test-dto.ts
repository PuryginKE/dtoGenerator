export interface TestDtoIntervalsResp { 
 begin: string;
 end: string;
}

export class TestDtoIntervals { 
 public begin: string;
 public end: string;

 constructor(data: TestDtoIntervalsResp) { 
  Object.assign(this, data); 
 }
}

export const TestDtoIntervalsDtoFn = (data: any) => new TestDtoIntervals({
 begin: data.begin,
 end: data.end,
});

export interface TestDtoResp { 
 countries: string;
 intervals: TestDtoIntervals;
 reasonIds: number;
 regions: number;
 type: string;
}

export class TestDto { 
 public countries: string;
 public intervals: TestDtoIntervals;
 public reasonIds: number;
 public regions: number;
 public type: string;

 constructor(data: TestDtoResp) { 
  Object.assign(this, data); 
 }
}

export const TestDtoDtoFn = (data: any) => new TestDto({
 countries: data.countries,
 intervals: data.intervals,
 reasonIds: data.reason_ids,
 regions: data.regions,
 type: data.type,
});

