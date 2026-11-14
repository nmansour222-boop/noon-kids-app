import zlib, struct, math

def png(path, size):
    W = H = size
    px = bytearray()
    cx = cy = size/2
    R = size*0.5
    for y in range(H):
        px.append(0)  # filter
        for x in range(W):
            dx, dy = x-cx+0.5, y-cy+0.5
            d = math.hypot(dx,dy)
            # rounded square background
            r = size*0.22
            inside = abs(dx) <= size/2 and abs(dy) <= size/2
            # corner rounding
            qx = max(abs(dx)-(size/2-r), 0); qy = max(abs(dy)-(size/2-r), 0)
            if math.hypot(qx,qy) > r: inside = False
            base = (255,122,89)
            if not inside:
                px += bytes((0,0,0,0)); continue
            # crescent moon: big white circle minus offset circle (bg color)
            moon_r = size*0.29
            c1 = (cx, cy)
            c2 = (cx + size*0.10, cy - size*0.06)
            inA = math.hypot(x-c1[0], y-c1[1]) <= moon_r
            inB = math.hypot(x-c2[0], y-c2[1]) <= moon_r*0.84
            col = base
            if inA and not inB:
                col = (255,255,255)
            # small star
            sx, sy = cx + size*0.17, cy + size*0.19
            ang = math.atan2(y-sy, x-sx)
            rr = math.hypot(x-sx, y-sy)
            star = rr <= size*0.055*(0.62+0.38*abs(math.cos(2.5*ang)))
            if star:
                col = (255,198,69)
            px += bytes((col[0],col[1],col[2],255))
    raw = zlib.compress(bytes(px), 9)
    def chunk(t, d):
        c = struct.pack('>I', len(d)) + t + d
        return c + struct.pack('>I', zlib.crc32(t+d) & 0xffffffff)
    data = b'\x89PNG\r\n\x1a\n'
    data += chunk(b'IHDR', struct.pack('>IIBBBBB', W, H, 8, 6, 0, 0, 0))
    data += chunk(b'IDAT', raw)
    data += chunk(b'IEND', b'')
    open(path,'wb').write(data)
    print(path, len(data))

png('app/icons/icon-192.png', 192)
png('app/icons/icon-512.png', 512)
