import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument, UserStatus } from '../schemas/user.schema.js';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'broker_workspace_super_secure_jwt_secret_key_2026',
    });
  }

  async validate(payload: { sub: string; email: string; role: string; companyId?: string }) {
    let user: any = null;
    try {
      user = await this.userModel.findById(payload.sub).select('-passwordHash');
    } catch {}

    if (!user && payload.email) {
      user = await this.userModel.findOne({ email: payload.email.toLowerCase() }).select('-passwordHash');
    }

    if (!user || user.status === UserStatus.INACTIVE) {
      throw new UnauthorizedException('User account is inactive or not found');
    }
    return user;
  }
}
