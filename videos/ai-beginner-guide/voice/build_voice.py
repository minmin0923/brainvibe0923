"""무료 오픈소스 음성(MeloTTS 한국어, MIT 라이선스)으로 내레이션을 만들고 영상 타이밍을 맞춘다.

    <melo venv>/bin/python voice/build_voice.py            # 없는 문장만 새로 만들고 전체를 다시 엮는다
    <melo venv>/bin/python voice/build_voice.py --redo c05  # 이 문장만 다시 만든다

만드는 것:
    voice/takes/<id>.wav     문장별 목소리 (MeloTTS가 만든 그대로, 속도 1.0)
    audio/narration.mp3      전체 내레이션 (영상의 0초 = 소리의 0초)
    js/cues.js               문장별 시작·끝 시간 (화면이 여기에 맞춰 움직인다)

Fish Audio 대신 쓰는 방법이라 스킬의 tts.mjs를 거치지 않는다. 타이밍 규칙은 tts.mjs와 같다:
leadIn 뒤에 문장을 차례로 놓고, 문장 사이는 gapAfter(없으면 gap)만큼 띄운다.
"""
import json, os, subprocess, sys, wave
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
TAKES = ROOT / 'voice' / 'takes'
SR = 44100
SPEED = 1.0
# 문장 앞 침묵은 0.05초, 문장 안·끝의 침묵은 0.35초까지만 남긴다 (영상에 빈 소리가 길게 남지 않게)
TRIM = ('silenceremove=start_periods=1:start_threshold=-40dB:start_silence=0.05:'
        'stop_periods=-1:stop_duration=0.35:stop_threshold=-40dB:stop_silence=0.35')


def load_script():
    return json.loads((ROOT / 'script.json').read_text(encoding='utf-8'))


def synth(cues, redo):
    todo = [c for c in cues if c['id'] in redo or not (TAKES / f"{c['id']}.wav").exists()]
    if not todo:
        return
    from melo.api import TTS
    tts = TTS(language='KR', device='cpu')
    spk = tts.hps.data.spk2id['KR']
    for c in todo:
        out = TAKES / f"{c['id']}.wav"
        print('  만드는 중', c['id'], c['say'][:30], flush=True)
        tts.tts_to_file(c['say'], spk, str(out), speed=SPEED, quiet=True)


def to_mono44(src):
    """ffmpeg로 44.1kHz 모노 16bit PCM 바이트로 바꾼다"""
    r = subprocess.run(['ffmpeg', '-v', 'error', '-i', str(src), '-af', TRIM, '-ac', '1', '-ar', str(SR), '-f', 's16le', '-'],
                       capture_output=True, check=True)
    return r.stdout


def main():
    redo = set(sys.argv[sys.argv.index('--redo') + 1].split(',')) if '--redo' in sys.argv else set()
    TAKES.mkdir(parents=True, exist_ok=True)
    s = load_script()
    cues = s['cues']
    synth(cues, redo)

    lead, gap, tail = s.get('leadIn', 0.3), s.get('gap', 0.25), s.get('tail', 1.5)
    pcm = bytearray(b'\0\0' * int(lead * SR))
    out = []
    for i, c in enumerate(cues):
        b = to_mono44(TAKES / f"{c['id']}.wav")
        start = len(pcm) / 2 / SR
        pcm += b
        end = len(pcm) / 2 / SR
        out.append({'id': c['id'], 'text': c['text'], 'say': c['say'], 'start': round(start, 3), 'end': round(end, 3),
                    'duration': round(end - start, 3)})
        if i < len(cues) - 1:
            pcm += b'\0\0' * int(c.get('gapAfter', gap) * SR)
    audio_dur = len(pcm) / 2 / SR

    wav = ROOT / 'voice' / 'narration.wav'
    with wave.open(str(wav), 'wb') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes(bytes(pcm))
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(wav), '-af', 'loudnorm=I=-16:TP=-2', '-ar', str(SR),
                    '-b:a', '160k', str(ROOT / 'audio' / 'narration.mp3')], check=True)

    old = (ROOT / 'js' / 'cues.js').read_text(encoding='utf-8')
    sig = json.loads(old[old.index('{'):old.rindex('}') + 1]).get('scriptSig', '')
    data = {'title': s['title'], 'lang': s['lang'], 'audio': 'audio/narration.mp3', 'audioDuration': round(audio_dur, 3),
            'duration': round(audio_dur + tail, 3), 'leadIn': lead, 'tail': tail, 'placeholder': False,
            'narration': True, 'voice': 'MeloTTS KR (MIT, 무료 오픈소스)', 'model': 'melotts-korean',
            'scriptSig': sig, 'cues': out}
    (ROOT / 'js' / 'cues.js').write_text(
        '// voice/build_voice.py가 만든 파일 — script.json을 고치고 다시 실행하세요.\nwindow.VIDEO_DATA = '
        + json.dumps(data, ensure_ascii=False, indent=2) + ';\n', encoding='utf-8')
    print(f'완료: 문장 {len(out)}개 · 내레이션 {audio_dur:.1f}초 · 영상 {audio_dur + tail:.1f}초')


if __name__ == '__main__':
    main()
