"""
Utilitário de compressão de imagens.
Redimensiona para no máximo MAX_DIM e converte para WebP com qualidade QUALITY.
Retorna um InMemoryUploadedFile pronto para salvar no model.
"""
import io
from django.core.files.uploadedfile import InMemoryUploadedFile
from PIL import Image

MAX_DIM  = 1280   # px — lado máximo (mantém proporção)
QUALITY  = 82     # qualidade WebP (0-100)


def compress_image(upload_file, filename_hint: str = "image") -> InMemoryUploadedFile:
    """
    Recebe um InMemoryUploadedFile / TemporaryUploadedFile e devolve
    um InMemoryUploadedFile comprimido em WebP.
    """
    img = Image.open(upload_file)

    # Converte RGBA / P para RGB (WebP suporta, mas garante consistência)
    if img.mode in ("RGBA", "P"):
        img = img.convert("RGBA")
    elif img.mode != "RGB":
        img = img.convert("RGB")

    # Redimensiona mantendo proporção
    img.thumbnail((MAX_DIM, MAX_DIM), Image.LANCZOS)

    output = io.BytesIO()
    img.save(output, format="WEBP", quality=QUALITY, optimize=True)
    output.seek(0)

    # Gera nome de arquivo com extensão .webp
    base = filename_hint.rsplit(".", 1)[0]
    new_name = f"{base}.webp"

    return InMemoryUploadedFile(
        file=output,
        field_name=None,
        name=new_name,
        content_type="image/webp",
        size=output.getbuffer().nbytes,
        charset=None,
    )
