// quadtree.ts
export class Point<T> {
  x: number
  y: number
  data: T
  constructor(x: number, y: number, data: T) {
    this.x = x
    this.y = y
    this.data = data
  }
}

export class Rectangle {
  x: number
  y: number
  w: number
  h: number
  constructor(x: number, y: number, w: number, h: number) {
    this.x = x
    this.y = y
    this.w = w
    this.h = h
  }
  contains(point: Point<any>): boolean {
    return (
      point.x >= this.x - this.w &&
      point.x <= this.x + this.w &&
      point.y >= this.y - this.h &&
      point.y <= this.y + this.h
    )
  }
  intersects(range: Rectangle): boolean {
    return !(
      range.x - range.w > this.x + this.w ||
      range.x + range.w < this.x - this.w ||
      range.y - range.h > this.y + this.h ||
      range.y + range.h < this.y - this.h
    )
  }
}

export class Quadtree<T> {
  boundary: Rectangle
  capacity: number
  points: Point<T>[]
  divided: boolean
  northeast?: Quadtree<T>
  northwest?: Quadtree<T>
  southeast?: Quadtree<T>
  southwest?: Quadtree<T>

  constructor(boundary: Rectangle, capacity: number) {
    this.boundary = boundary
    this.capacity = capacity
    this.points = []
    this.divided = false
  }

  subdivide(): void {
    const x = this.boundary.x
    const y = this.boundary.y
    const w = this.boundary.w
    const h = this.boundary.h
    const ne = new Rectangle(x + w / 2, y - h / 2, w / 2, h / 2)
    this.northeast = new Quadtree(ne, this.capacity)
    const nw = new Rectangle(x - w / 2, y - h / 2, w / 2, h / 2)
    this.northwest = new Quadtree(nw, this.capacity)
    const se = new Rectangle(x + w / 2, y + h / 2, w / 2, h / 2)
    this.southeast = new Quadtree(se, this.capacity)
    const sw = new Rectangle(x - w / 2, y + h / 2, w / 2, h / 2)
    this.southwest = new Quadtree(sw, this.capacity)
    this.divided = true
  }

  insert(point: Point<T>): boolean {
    if (!this.boundary.contains(point)) {
      return false
    }
    if (this.points.length < this.capacity) {
      this.points.push(point)
      return true
    }
    if (!this.divided) {
      this.subdivide()
    }
    if (this.northeast!.insert(point)) return true
    if (this.northwest!.insert(point)) return true
    if (this.southeast!.insert(point)) return true
    if (this.southwest!.insert(point)) return true
    return false
  }

  query(range: Rectangle, found: Point<T>[] = []): Point<T>[] {
    if (!this.boundary.intersects(range)) {
      return found
    }
    for (const p of this.points) {
      if (range.contains(p)) {
        found.push(p)
      }
    }
    if (this.divided) {
      this.northwest!.query(range, found)
      this.northeast!.query(range, found)
      this.southwest!.query(range, found)
      this.southeast!.query(range, found)
    }
    return found
  }
}
