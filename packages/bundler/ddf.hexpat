struct Extf {
    char fileType[4] [[name("File Type")]];
    u16 pathSize [[name("Path Size")]];
    char path[pathSize] [[name("Path")]];
    u16 mtimeSize [[name("Modification Time Size")]];
    char mtime[mtimeSize] [[name("Modification Time")]];
    u32 fsize [[name("File Size")]];
    char content[fsize] [[name("File Content")]];
};

struct DDFBChunk {
    char id[4] [[name(this)]];
    u32 length [[name("Chunk Size")]];

    if (id == "DESC") {
        char text[length] [[name("DESC Content")]];
    } else if (id == "EXTF") {
        Extf extf [[name("External file"), inline]];
    } else if (id == "VALI") {
        char content[length] [[name("Validation result")]];
    }
    else {
        padding[length];
    }
};

struct Sign {
    u16 publicKeySize [[name("Public Key Size")]];
    u8 publicKey[publicKeySize] [[name("Public Key")]];
    u16 signatureSize [[name("Signature Size")]];
    u8 signature[signatureSize] [[name("Signature")]];
};

struct Chunks {
    char id[4] [[name(this)]];
    u32 length [[name(id + " Size")]];

    if (id == "DDFB") {
        DDFBChunk chunks[while($ < length)] [[inline]];
    }
    else if (id == "SIGN") {
        Sign signature [[inline]];
    }
    else {
        padding[length];
    }
};

struct RIFF {
    char id[4] [[name("RIFF Header Signature")]];
    u32 length [[name("RIFF Chunk Size")]];
    Chunks chunks[while($ < length)] [[inline]];
} [[inline]];

RIFF RIFF @ 0x00;