export class Buf {
    data: Uint8Array;
    offset: number;

    constructor(size: number = 0) { this.offset = 0; this.data = new Uint8Array(size); }

    skip(count: number) {
        const pos = this.offset + count;
        if (pos > this.data.length) throw new Error("EndOfBufferError");
        this.offset = pos;
    }

    put_to_offset(offset: number, data: Uint8Array) {
        const pos = offset + data.length;
        if (pos > this.data.length) throw new Error("EndOfBufferError");
        for (let i = 0; i < data.length; i++) this.data[offset + i] = data[i];
        return pos;
    }
    put(data: Uint8Array) { this.offset = this.put_to_offset(this.offset, data); }

    put_u8_to_offset(offset: number, val: number) {
        const pos = offset + 1;
        if (pos > this.data.length) throw new Error("EndOfBufferError");
        this.data[offset + 0] = val & 0xff;
        return pos;
    }
    put_u8(val: number) { this.offset = this.put_u8_to_offset(this.offset, val); }

    put_u16_be_to_offset(offset: number, val: number) {
        const pos = offset + 2;
        if (pos > this.data.length) throw new Error("EndOfBufferError");
        this.data[offset + 0] = (val >> 8) & 0xff;
        this.data[offset + 1] = (val >> 0) & 0xff;
        return pos;
    }
    put_u16_be(val: number) { this.offset = this.put_u16_be_to_offset(this.offset, val); }

    put_u16_le_to_offset(offset: number, val: number) {
        const pos = offset + 2;
        if (pos > this.data.length) throw new Error("EndOfBufferError");
        this.data[offset + 0] = (val >> 0) & 0xff;
        this.data[offset + 1] = (val >> 8) & 0xff;
        return pos;
    }
    put_u16le(val: number) { this.offset = this.put_u16_le_to_offset(this.offset, val); }

    put_u32_be_to_offset(offset: number, val: number) {
        const pos = offset + 4;
        if (pos > this.data.length) throw new Error("EndOfBufferError");
        this.data[offset + 0] = (val >> 24) & 0xff;
        this.data[offset + 1] = (val >> 16) & 0xff;
        this.data[offset + 2] = (val >>  8) & 0xff;
        this.data[offset + 3] = (val >>  0) & 0xff;
        return pos;
    }
    put_u32_be(val: number) { this.offset = this.put_u32_be_to_offset(this.offset, val); }
    put_i32_be(val: number) { this.offset = this.put_u32_be_to_offset(this.offset, val); }
    
    put_u64_be(val: number) {
        this.offset = this.put_u32_be_to_offset(this.offset, 0);
        this.offset = this.put_u32_be_to_offset(this.offset, val);
    }

    put_u32_le_to_offset(offset: number, val: number) {
        const pos = offset + 4;
        if (pos > this.data.length) throw new Error("EndOfBufferError");
        this.data[offset + 0] = (val >>  0) & 0xff;
        this.data[offset + 1] = (val >>  8) & 0xff;
        this.data[offset + 2] = (val >> 16) & 0xff;
        this.data[offset + 3] = (val >> 24) & 0xff;
        return pos;
    }
    put_u32_le(val: number) { this.offset = this.put_u32_le_to_offset(this.offset, val); }

    put_str4_to_offset(offset: number, str: string) {
        if (str.length != 4) throw new Error("Id length is not 4");
        const pos = offset + str.length;
        if (pos > this.data.length) throw new Error("EndOfBufferError");
        for (let i = 0; i < str.length; i++) { this.data[offset + i] = str[i].charCodeAt(0); }
        return pos;
    }
    put_str4(str: string) { this.offset = this.put_str4_to_offset(this.offset, str); }
    put_counted_str_to_offset(offset: number, str: string) { 
        const pos = offset + str.length + 1;
        if (pos > this.data.length) throw new Error("EndOfBufferError");
        for (let i = 0; i < str.length; i++) { this.data[offset + i] = str[i].charCodeAt(0); }
        this.data[pos] = 0;
        return pos;
     }
    put_counted_str(str: string) { this.offset = this.put_counted_str_to_offset(this.offset, str); }

    hexStr() : string {
        let str = '';
        for(let i = 0; i < this.offset; i++) {
            if (i % 40 === 0) str += '\n';
            if (i % 4 === 0 && i+1 < this.data.length) {
                if (i > 0 && i % 40 !== 0) str += ' ';
                str += '0x';
            }
            str += decimalToHex(this.data[i]);
        }
        return str;
    }

    read_from_offset(offset: number, size: number) : Uint8Array {
        if (offset + size >= this.data.length) throw new Error("EndOfBufferError");
        return this.data.subarray(offset, offset + size);
    }

    read_u8() : number {
        if (this.offset >= this.data.length) throw new Error("EndOfBufferError");
        const value = this.data[this.offset];
        this.offset += 1;
        return value;
    }

    read_u16_le() : number {
        let val = 0;
        val += this.read_u8() << 0;
        val += this.read_u8() << 8;
        return val;
    }

    read_u16_be() : number {
        let val = 0;
        val += this.read_u8() << 8;
        val += this.read_u8() << 0;
        return val;
    }

    read_u32_le() : number {
        let val = 0;
        val += this.read_u8() << 0;
        val += this.read_u8() << 8;
        val += this.read_u8() << 16;
        val += this.read_u8() << 24;
        return val;
    }

    read_u32_be() : number {
        let val = 0;
        val += this.read_u8() << 24;
        val += this.read_u8() << 16;
        val += this.read_u8() << 8;
        val += this.read_u8() << 0;
        return val;
    }

    read_counted_str(size: number) : string {
        let str = '';
        for(let i = 0; i < size; i++) {
            const ch = this.read_u8();
            if (ch > 0) str += String.fromCharCode(ch);
        }
        return str;
    }
}

function decimalToHex(val: number) : string {
    let hex = val.toString(16);
    return "00".substr(0, 2 - hex.length) + hex; 
}